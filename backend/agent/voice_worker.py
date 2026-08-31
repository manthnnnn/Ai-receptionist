import os
import json
import logging
import asyncio
from typing import Annotated, Optional
from dotenv import load_dotenv

from livekit.agents import (
    AutoSubscribe,
    JobContext,
    JobProcess,
    WorkerOptions,
    cli,
    llm,
)
from livekit.agents.voice_assistant import VoiceAssistant
from livekit.plugins import cartesia, deepgram, openai, silero

from backend.config import settings
from backend.agent.prompts import build_voice_system_prompt
from backend.tools.clinic_tools import ClinicTools

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("voice-worker")


def prewarm(proc: JobProcess):
    """Preload Silero VAD into memory for sub-30ms voice activity detection."""
    proc.userdata["vad"] = silero.VAD.load()
    logger.info("Silero VAD model prewarmed successfully.")


class ClinicAssistantFunctionContext(llm.FunctionContext):
    """Registers the 8 Clinic Phone Receptionist tools as LLM function calls."""

    def __init__(self, clinic_id: str):
        super().__init__()
        self.clinic_id = clinic_id

    @llm.ai_callable(description="Retrieves clinic profile, address, operating hours, accepted insurance, parking, and FAQs.")
    async def get_clinic_information(self) -> str:
        res = ClinicTools.get_clinic_information(self.clinic_id)
        return json.dumps(res)

    @llm.ai_callable(description="Retrieves doctor roster, specialties, consultation fees, and experience.")
    async def get_doctor_information(
        self,
        specialty: Annotated[Optional[str], llm.TypeInfo(description="Doctor specialty e.g. Root Canal, Orthodontist")] = None
    ) -> str:
        res = ClinicTools.get_doctor_information(self.clinic_id, specialty)
        return json.dumps(res)

    @llm.ai_callable(description="Checks available appointment slots for a specific date and doctor.")
    async def check_availability(
        self,
        target_date: Annotated[str, llm.TypeInfo(description="Date in YYYY-MM-DD format e.g. 2026-09-01 or 'tomorrow'")],
        doctor_name: Annotated[Optional[str], llm.TypeInfo(description="Name of the preferred doctor")] = None
    ) -> str:
        res = ClinicTools.check_availability(self.clinic_id, target_date, doctor_name)
        return json.dumps(res)

    @llm.ai_callable(description="Locks the calendar slot and confirms appointment with SMS dispatch.")
    async def book_appointment(
        self,
        doctor_id: Annotated[str, llm.TypeInfo(description="ID of the doctor")],
        patient_name: Annotated[str, llm.TypeInfo(description="Full name of the patient")],
        patient_phone: Annotated[str, llm.TypeInfo(description="Patient 10-digit mobile number")],
        start_at: Annotated[str, llm.TypeInfo(description="ISO timestamp of the chosen slot e.g. 2026-09-01T10:00:00Z")],
        notes: Annotated[Optional[str], llm.TypeInfo(description="Reason for visit or chief complaint")] = None
    ) -> str:
        res = ClinicTools.book_appointment(
            self.clinic_id, doctor_id, patient_name, patient_phone, start_at, notes
        )
        return json.dumps(res)

    @llm.ai_callable(description="Looks up appointments booked under a patient's mobile number.")
    async def get_patient_appointments(
        self,
        patient_phone: Annotated[str, llm.TypeInfo(description="Patient's registered phone number")]
    ) -> str:
        res = ClinicTools.get_patient_appointments(self.clinic_id, patient_phone)
        return json.dumps(res)

    @llm.ai_callable(description="Cancels an existing appointment slot.")
    async def cancel_appointment(
        self,
        appointment_id: Annotated[str, llm.TypeInfo(description="Appointment ID to cancel")],
        reason: Annotated[Optional[str], llm.TypeInfo(description="Reason for cancellation")] = None
    ) -> str:
        res = ClinicTools.cancel_appointment(self.clinic_id, appointment_id, reason)
        return json.dumps(res)

    @llm.ai_callable(description="Reschedules an existing appointment to a new available time slot.")
    async def reschedule_appointment(
        self,
        appointment_id: Annotated[str, llm.TypeInfo(description="Appointment ID to reschedule")],
        new_start_at: Annotated[str, llm.TypeInfo(description="New ISO datetime slot")]
    ) -> str:
        res = ClinicTools.reschedule_appointment(self.clinic_id, appointment_id, new_start_at)
        return json.dumps(res)

    @llm.ai_callable(description="Transfers the call to a human receptionist or emergency doctor immediately.")
    async def transfer_to_human(
        self,
        reason: Annotated[str, llm.TypeInfo(description="Reason for human escalation e.g. emergency, patient request")],
        target_department: Annotated[Optional[str], llm.TypeInfo(description="Department e.g. reception, emergency")] = "reception"
    ) -> str:
        res = ClinicTools.transfer_to_human(self.clinic_id, reason, target_department)
        return json.dumps(res)


async def entrypoint(ctx: JobContext):
    """Main LiveKit real-time voice pipeline entrypoint for incoming SIP telephony calls."""
    logger.info(f"Connecting to LiveKit room: {ctx.room.name}")
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    # 1. Extract Clinic ID from room metadata or SIP headers
    clinic_id = "00000000-0000-0000-0000-000000000001"
    if ctx.room.metadata:
        try:
            meta = json.loads(ctx.room.metadata)
            clinic_id = meta.get("clinic_id", clinic_id)
        except Exception:
            clinic_id = ctx.room.metadata

    logger.info(f"Active Multi-Tenant Clinic ID: {clinic_id}")

    # 2. Fetch Clinic Settings to personalize persona & greeting
    clinic_info = ClinicTools.get_clinic_information(clinic_id)
    clinic_data = clinic_info.get("clinic", {}) if clinic_info.get("success") else {}
    clinic_name = clinic_data.get("name", "Apollo Dental Clinic")
    clinic_address = clinic_data.get("address", "45, 2nd Cross, Koramangala 4th Block, Bangalore")
    clinic_phone = clinic_data.get("phone_number", "+91-80-4567-8901")
    agent_name = clinic_data.get("agent_name", "Maya")
    primary_lang = clinic_data.get("primary_language", "mr")

    # 3. Configure Real-Time AI Pipeline Stack
    vad = ctx.proc.userdata.get("vad") or silero.VAD.load()

    # STT: Deepgram Nova-2 with Indian telephony optimization
    stt = deepgram.STT(
        api_key=settings.DEEPGRAM_API_KEY or os.getenv("DEEPGRAM_API_KEY"),
        model="nova-2",
        language="en-IN",
        smart_format=True,
    )

    # LLM: Groq LLaMA 3.3 (Fast sub-300ms time-to-first-token) with OpenAI fallback
    groq_key = settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY")
    if groq_key:
        llm_instance = openai.LLM(
            base_url="https://api.groq.com/openai/v1",
            api_key=groq_key,
            model="llama-3.3-70b-versatile",
            temperature=0.45,
        )
    else:
        llm_instance = openai.LLM(
            api_key=settings.OPENAI_API_KEY or os.getenv("OPENAI_API_KEY"),
            model="gpt-4o-mini",
            temperature=0.45,
        )

    # TTS: Cartesia Sonic with ultra-low latency voice synthesis
    cartesia_key = settings.CARTESIA_API_KEY or os.getenv("CARTESIA_API_KEY")
    if cartesia_key:
        tts = cartesia.TTS(
            api_key=cartesia_key,
            voice="a0e99841-438c-4a64-b679-ae501e7d6091",  # Warm Indian English / Multilingual Voice
            model="sonic-multilingual",
        )
    else:
        # Fallback to OpenAI TTS
        tts = openai.TTS(
            api_key=settings.OPENAI_API_KEY or os.getenv("OPENAI_API_KEY"),
            voice="shimmer",
        )

    # 4. Build System Prompt & Bind Function Calling Tools
    system_prompt = build_voice_system_prompt(
        clinic_name=clinic_name,
        clinic_address=clinic_address,
        clinic_phone=clinic_phone,
        agent_name=agent_name,
        primary_language=primary_lang
    )

    fn_context = ClinicAssistantFunctionContext(clinic_id=clinic_id)

    # 5. Initialize LiveKit VoiceAssistant Agent
    initial_greeting = (
        f"नमस्कार! {clinic_name} मध्ये आपले स्वागत आहे. मी {agent_name}, आपली काय मदत करू?"
        if primary_lang == "mr"
        else f"नमस्ते! {clinic_name} में आपका स्वागत है। मैं {agent_name}, आपकी क्या सहायता करूँ?"
        if primary_lang == "hi"
        else f"Hello! Thank you for calling {clinic_name}. My name is {agent_name}. How can I assist you today?"
    )

    assistant = VoiceAssistant(
        vad=vad,
        stt=stt,
        llm=llm_instance,
        tts=tts,
        fnc_ctx=fn_context,
        chat_ctx=llm.ChatContext().append(
            role="system",
            text=system_prompt,
        ),
    )

    assistant.start(ctx.room)
    await asyncio.sleep(0.5)

    # Greet the caller upon pick up
    await assistant.say(initial_greeting, allow_interruptions=True)


def run_worker():
    """CLI runner for the LiveKit Voice Agent worker process."""
    logger.info("Starting LiveKit Voice Assistant Worker...")
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
        )
    )


if __name__ == "__main__":
    run_worker()
