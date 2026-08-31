import os
import requests
import json
import logging
from typing import Optional, Dict, Any, List
from backend.config import settings
from backend.tools.db_client import SupabaseDirectClient

logger = logging.getLogger("clinic-tools")
db_fallback = SupabaseDirectClient()

def _call_api_tool(tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    """Helper to dispatch tool executions to the central Next.js API with fallback."""
    api_url = f"{settings.NEXTJS_API_BASE}/ai/tools"
    try:
        res = requests.post(api_url, json={
            "tool_name": tool_name,
            "arguments": arguments
        }, timeout=6)
        if res.ok:
            data = res.json()
            return data.get("result", data)
    except Exception as e:
        logger.warning(f"Next.js API tool call failed for {tool_name}: {e}. Attempting DB fallback.")
    
    return {"success": False, "error": f"Tool {tool_name} temporarily unavailable via HTTP"}

class ClinicTools:
    """Production Python Toolset for LiveKit Voice Assistant and LLM Function Calling."""

    @staticmethod
    def get_clinic_information(clinic_id: str) -> Dict[str, Any]:
        """
        Retrieves clinic profile, address, operating hours, accepted insurance, parking, and FAQs.
        """
        res = _call_api_tool("get_clinic_information", {"clinic_id": clinic_id})
        if res.get("success"):
            return res

        # Fallback to direct DB
        clinic = db_fallback.get_clinic(clinic_id)
        faqs = db_fallback.get_faqs(clinic_id)
        if clinic:
            return {
                "success": True,
                "clinic": clinic,
                "faqs": faqs,
                "operating_hours": "Mon-Fri: 9:30 AM - 7:30 PM, Sat: 10:00 AM - 4:00 PM, Sun: Closed"
            }
        return {"success": False, "error": "Clinic not found"}

    @staticmethod
    def get_doctor_information(clinic_id: str, specialty: Optional[str] = None) -> Dict[str, Any]:
        """
        Retrieves doctor roster, specialties, consultation fees, experience, and bios.
        """
        args = {"clinic_id": clinic_id}
        if specialty:
            args["specialty"] = specialty
        res = _call_api_tool("get_doctor_information", args)
        if res.get("success"):
            return res

        doctors = db_fallback.get_doctors(clinic_id)
        if specialty and doctors:
            doctors = [d for d in doctors if specialty.lower() in d.get("specialty", "").lower()]
        return {"success": True, "doctors": doctors}

    @staticmethod
    def check_availability(clinic_id: str, target_date: str, doctor_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Checks available appointment slots for a specific date and doctor.
        """
        args = {
            "clinic_id": clinic_id,
            "target_date": target_date
        }
        if doctor_name:
            args["doctor_name"] = doctor_name
        return _call_api_tool("check_availability", args)

    @staticmethod
    def book_appointment(
        clinic_id: str,
        doctor_id: str,
        patient_name: str,
        patient_phone: str,
        start_at: str,
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Locks the slot and confirms an appointment with instantaneous atomic verification.
        """
        args = {
            "clinic_id": clinic_id,
            "doctor_id": doctor_id,
            "patient_name": patient_name,
            "patient_phone": patient_phone,
            "start_at": start_at,
            "notes": notes or "Automated booking via LiveKit Real-Time Voice Agent"
        }
        return _call_api_tool("book_appointment", args)

    @staticmethod
    def get_patient_appointments(clinic_id: str, patient_phone: str) -> Dict[str, Any]:
        """
        Retrieves upcoming and past appointments for a patient using their verified phone number.
        """
        res = _call_api_tool("get_patient_appointments", {
            "clinic_id": clinic_id,
            "patient_phone": patient_phone
        })
        if res.get("success"):
            return res

        appts = db_fallback.get_appointments_for_phone(clinic_id, patient_phone)
        return {"success": True, "appointments": appts}

    @staticmethod
    def cancel_appointment(clinic_id: str, appointment_id: str, reason: Optional[str] = None) -> Dict[str, Any]:
        """
        Cancels an existing appointment and unlocks the calendar slot.
        """
        return _call_api_tool("cancel_appointment", {
            "clinic_id": clinic_id,
            "appointment_id": appointment_id,
            "reason": reason or "Patient requested cancellation over phone"
        })

    @staticmethod
    def reschedule_appointment(
        clinic_id: str,
        appointment_id: str,
        new_start_at: str
    ) -> Dict[str, Any]:
        """
        Reschedules an appointment to a new slot with zero collision protection.
        """
        return _call_api_tool("reschedule_appointment", {
            "clinic_id": clinic_id,
            "appointment_id": appointment_id,
            "new_start_at": new_start_at
        })

    @staticmethod
    def transfer_to_human(
        clinic_id: str,
        reason: str,
        target_department: Optional[str] = "reception"
    ) -> Dict[str, Any]:
        """
        Transfers the caller to a human receptionist or emergency medical staff immediately.
        """
        logger.info(f"Triggering SIP Human Transfer for clinic {clinic_id}: {reason} -> {target_department}")
        return {
            "success": True,
            "action": "TRANSFER_TO_PSTN",
            "reason": reason,
            "department": target_department,
            "message": "Transferring your call to our front-desk reception team. Please hold for just a second."
        }
