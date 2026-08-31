import os
import logging
from typing import Optional, Dict, Any, List
from backend.config import settings

logger = logging.getLogger("clinic-db-client")

class SupabaseDirectClient:
    """Direct Supabase PostgreSQL DB fallback client for the AI Receptionist."""
    
    def __init__(self):
        self.client = None
        if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY and "dummy" not in settings.SUPABASE_SERVICE_ROLE_KEY:
            try:
                from supabase import create_client, Client
                self.client: Optional[Client] = create_client(
                    settings.SUPABASE_URL,
                    settings.SUPABASE_SERVICE_ROLE_KEY
                )
                logger.info("Supabase direct DB client connected.")
            except Exception as e:
                logger.warning(f"Could not initialize direct Supabase client: {e}. Using REST fallback.")
        else:
            logger.info("Using HTTP REST API fallback for clinic data.")

    def get_clinic(self, clinic_id: str) -> Optional[Dict[str, Any]]:
        if not self.client:
            return None
        try:
            res = self.client.table("clinics").select("*").eq("id", clinic_id).single().execute()
            return res.data
        except Exception as e:
            logger.error(f"Error fetching clinic {clinic_id}: {e}")
            return None

    def get_doctors(self, clinic_id: str) -> List[Dict[str, Any]]:
        if not self.client:
            return []
        try:
            res = self.client.table("doctors").select("*").eq("clinic_id", clinic_id).eq("is_active", True).execute()
            return res.data or []
        except Exception as e:
            logger.error(f"Error fetching doctors for clinic {clinic_id}: {e}")
            return []

    def get_faqs(self, clinic_id: str) -> List[Dict[str, Any]]:
        if not self.client:
            return []
        try:
            res = self.client.table("faqs").select("*").eq("clinic_id", clinic_id).execute()
            return res.data or []
        except Exception as e:
            logger.error(f"Error fetching FAQs for clinic {clinic_id}: {e}")
            return []

    def get_appointments_for_phone(self, clinic_id: str, phone: str) -> List[Dict[str, Any]]:
        if not self.client:
            return []
        try:
            res = self.client.table("appointments").select(
                "*, doctors(name, specialty)"
            ).eq("clinic_id", clinic_id).eq("patient_phone", phone).execute()
            return res.data or []
        except Exception as e:
            logger.error(f"Error fetching appointments for phone {phone}: {e}")
            return []
