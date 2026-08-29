import { z } from 'zod';

export const GetClinicInfoSchema = z.object({
  clinic_id: z.string().describe('The unique identifier of the clinic.'),
});

export const GetDoctorInfoSchema = z.object({
  clinic_id: z.string().describe('The unique identifier of the clinic.'),
  specialty: z.string().optional().describe('Optional medical specialty filter, e.g. "Root Canal", "Orthodontist", "Laser".'),
  doctor_name: z.string().optional().describe('Optional doctor name substring to search for.'),
});

export const CheckAvailabilitySchema = z.object({
  clinic_id: z.string().describe('The unique identifier of the clinic.'),
  doctor_id: z.string().optional().describe('Specific doctor ID if requested by patient.'),
  doctor_name: z.string().optional().describe('Doctor name if mentioned by caller, e.g. "Dr. Verma" or "Ashish".'),
  target_date: z.string().describe('Target date in YYYY-MM-DD format (e.g. "2026-08-30"). If user says "tomorrow", convert to next date.'),
});

export const BookAppointmentSchema = z.object({
  clinic_id: z.string().describe('The unique identifier of the clinic.'),
  doctor_id: z.string().describe('The unique identifier of the doctor.'),
  patient_name: z.string().min(2, 'Patient name is required').describe('Full name of the patient.'),
  patient_phone: z.string().min(8, 'Patient phone number is required').describe('Contact phone number with country code, e.g. "+91 98765 43210".'),
  start_at: z.string().describe('Full ISO 8601 start timestamp of the selected slot, e.g. "2026-08-30T10:00:00Z".'),
  notes: z.string().optional().describe('Chief dental/medical complaint or reason for visit.'),
});

export const GetPatientAppointmentsSchema = z.object({
  clinic_id: z.string().describe('The unique identifier of the clinic.'),
  caller_phone: z.string().describe('Phone number of the caller to look up existing bookings.'),
  patient_name: z.string().optional().describe('Patient name for identity verification.'),
});

export const CancelAppointmentSchema = z.object({
  clinic_id: z.string().describe('The unique identifier of the clinic.'),
  appointment_id: z.string().describe('The unique appointment ID to cancel.'),
  caller_phone: z.string().describe('Caller phone number for verification.'),
  patient_name: z.string().describe('Patient name for verification.'),
  reason: z.string().optional().describe('Reason for cancellation.'),
});

export const RescheduleAppointmentSchema = z.object({
  clinic_id: z.string().describe('The unique identifier of the clinic.'),
  appointment_id: z.string().describe('The unique appointment ID to reschedule.'),
  caller_phone: z.string().describe('Caller phone number for verification.'),
  patient_name: z.string().describe('Patient name for verification.'),
  new_start_at: z.string().describe('New ISO 8601 start timestamp for the appointment, e.g. "2026-08-30T15:00:00Z".'),
});

export const TransferToHumanSchema = z.object({
  clinic_id: z.string().describe('The unique identifier of the clinic.'),
  call_id: z.string().optional().describe('Current call ID if available.'),
  reason: z.string().describe('Reason for escalation: e.g. "EMERGENCY_CHEST_PAIN", "COMPLEX_COMPLAINT", "CALLER_REQUESTED_HUMAN".'),
});
