import os
import requests
import json

API_BASE = os.getenv("NEXTJS_API_BASE", "http://localhost:3000/api")

class ClinicDatabase:
    def __init__(self, supabase_url: str = "", supabase_key: str = ""):
        self.api_base = API_BASE

    def check_availability(self, clinic_id: str, doctor_name: str, target_date: str) -> dict:
        try:
            res = requests.post(f"{self.api_base}/ai/tools", json={
                "tool_name": "check_availability",
                "arguments": {
                    "clinic_id": clinic_id,
                    "doctor_name": doctor_name,
                    "target_date": target_date
                }
            }, timeout=5)
            return res.json().get("result", {})
        except Exception as e:
            return {"success": False, "error": str(e)}

    def book_appointment(self, clinic_id: str, doctor_id: str, patient_name: str, patient_phone: str, slot_time: str) -> dict:
        try:
            res = requests.post(f"{self.api_base}/ai/tools", json={
                "tool_name": "book_appointment",
                "arguments": {
                    "clinic_id": clinic_id,
                    "doctor_id": doctor_id,
                    "patient_name": patient_name,
                    "patient_phone": patient_phone,
                    "start_at": slot_time
                }
            }, timeout=5)
            return res.json().get("result", {})
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_clinic_faq(self, clinic_id: str) -> dict:
        try:
            res = requests.post(f"{self.api_base}/ai/tools", json={
                "tool_name": "get_clinic_information",
                "arguments": {"clinic_id": clinic_id}
            }, timeout=5)
            return res.json().get("result", {})
        except Exception as e:
            return {"success": False, "error": str(e)}
