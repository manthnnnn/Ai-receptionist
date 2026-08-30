import { z } from 'zod';

// ─── Shared field patterns ───────────────────────────────────────────────────
const ClinicIdField = z.string().uuid('clinic_id must be a valid UUID');
const PhoneField = z.string().min(7, 'Phone number is required').regex(
  /^[+\d\s\-().]{7,20}$/,
  'Phone number must be a valid international format'
);
const DateField = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  'Date must be in YYYY-MM-DD format (e.g. "2026-08-30")'
);
const ISODateTimeField = z.string().regex(
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
  'Timestamp must be in ISO 8601 format (e.g. "2026-08-30T10:00:00Z")'
);

// ─── Tool 1: Get Clinic Information & FAQs ───────────────────────────────────
export const GetClinicInfoSchema = z.object({
  clinic_id: ClinicIdField.describe('The unique identifier of the clinic.'),
});

// ─── Tool 2: Get Doctor Information & Roster ─────────────────────────────────
export const GetDoctorInfoSchema = z.object({
  clinic_id: ClinicIdField.describe('The unique identifier of the clinic.'),
  specialty: z.string().optional().describe('Optional medical specialty filter, e.g. "Root Canal", "Orthodontist", "Laser".'),
  doctor_name: z.string().optional().describe('Optional doctor name substring to search for.'),
});

// ─── Tool 3: Check Real-Time Availability ────────────────────────────────────
export const CheckAvailabilitySchema = z.object({
  clinic_id: ClinicIdField.describe('The unique identifier of the clinic.'),
  doctor_id: z.string().optional().describe('Specific doctor ID if requested by patient.'),
  doctor_name: z.string().optional().describe('Doctor name if mentioned by caller, e.g. "Dr. Verma" or "Ashish".'),
  target_date: DateField.describe('Target date in YYYY-MM-DD format. If user says "tomorrow", convert to next date.'),
});

// ─── Tool 4: Book Appointment ────────────────────────────────────────────────
export const BookAppointmentSchema = z.object({
  clinic_id: ClinicIdField.describe('The unique identifier of the clinic.'),
  doctor_id: z.string().min(1, 'Doctor ID is required').describe('The unique identifier of the doctor.'),
  patient_name: z.string().min(2, 'Patient name is required').describe('Full name of the patient.'),
  patient_phone: PhoneField.describe('Contact phone number with country code, e.g. "+91 98765 43210".'),
  start_at: ISODateTimeField.describe('Full ISO 8601 start timestamp of the selected slot, e.g. "2026-08-30T10:00:00Z".'),
  notes: z.string().max(500).optional().describe('Chief dental/medical complaint or reason for visit.'),
});

// ─── Tool 5: Get Patient Appointments ───────────────────────────────────────
export const GetPatientAppointmentsSchema = z.object({
  clinic_id: ClinicIdField.describe('The unique identifier of the clinic.'),
  caller_phone: PhoneField.describe('Phone number of the caller to look up existing bookings.'),
  patient_name: z.string().optional().describe('Patient name for identity verification.'),
});

// ─── Tool 6: Cancel Appointment ─────────────────────────────────────────────
export const CancelAppointmentSchema = z.object({
  clinic_id: ClinicIdField.describe('The unique identifier of the clinic.'),
  appointment_id: z.string().min(1, 'Appointment ID is required').describe('The unique appointment ID to cancel.'),
  caller_phone: PhoneField.describe('Caller phone number for verification.'),
  patient_name: z.string().min(2).describe('Patient name for verification.'),
  reason: z.string().max(300).optional().describe('Reason for cancellation.'),
});

// ─── Tool 7: Reschedule Appointment ─────────────────────────────────────────
export const RescheduleAppointmentSchema = z.object({
  clinic_id: ClinicIdField.describe('The unique identifier of the clinic.'),
  appointment_id: z.string().min(1, 'Appointment ID is required').describe('The unique appointment ID to reschedule.'),
  caller_phone: PhoneField.describe('Caller phone number for verification.'),
  patient_name: z.string().min(2).describe('Patient name for verification.'),
  new_start_at: ISODateTimeField.describe('New ISO 8601 start timestamp for the appointment, e.g. "2026-08-30T15:00:00Z".'),
});

// ─── Tool 8: Transfer to Human Staff ────────────────────────────────────────
export const TransferToHumanSchema = z.object({
  clinic_id: ClinicIdField.describe('The unique identifier of the clinic.'),
  call_id: z.string().optional().describe('Current call ID if available.'),
  reason: z.enum([
    'MEDICAL_EMERGENCY_DETECTED',
    'CALLER_REQUESTED_HUMAN',
    'COMPLEX_COMPLAINT',
    'AI_CONFIDENCE_LOW',
    'EMERGENCY_CHEST_PAIN',
    'UNRESOLVED_AFTER_3_TURNS',
  ]).describe('Reason for escalation.'),
});

// ─── Tool 9 (NEW): Get Clinic FAQs by Category ──────────────────────────────
export const GetClinicFAQsSchema = z.object({
  clinic_id: ClinicIdField.describe('The unique identifier of the clinic.'),
  category: z.enum([
    'general',
    'dental',
    'insurance',
    'payments',
    'parking',
    'appointments',
    'doctors',
    'emergency',
  ]).optional().describe('FAQ category to filter by. Leave blank to get all FAQs.'),
});

// ─── Tool 10 (NEW): Log Dialogue Turn ───────────────────────────────────────
export const LogDialogueTurnSchema = z.object({
  call_sid: z.string().describe('The Twilio CallSid or internal call ID to attach the turn to.'),
  speaker: z.enum(['user', 'ai']).describe('Who spoke this turn.'),
  text: z.string().min(1).max(2000).describe('The spoken text of this turn.'),
  tool_called: z.string().optional().describe('Name of any tool the AI called during this turn.'),
  latency_ms: z.number().int().min(0).max(30000).optional().describe('AI response latency in milliseconds.'),
  language: z.enum(['en', 'hi', 'mr']).optional().describe('Detected language of this turn.'),
});

// ─── Tool Schema Map (for dynamic validation) ────────────────────────────────
export const toolSchemaMap = {
  get_clinic_information: GetClinicInfoSchema,
  get_doctor_information: GetDoctorInfoSchema,
  check_availability: CheckAvailabilitySchema,
  book_appointment: BookAppointmentSchema,
  get_patient_appointments: GetPatientAppointmentsSchema,
  cancel_appointment: CancelAppointmentSchema,
  reschedule_appointment: RescheduleAppointmentSchema,
  transfer_to_human: TransferToHumanSchema,
  get_clinic_faqs: GetClinicFAQsSchema,
  log_dialogue_turn: LogDialogueTurnSchema,
} as const;

export type ToolName = keyof typeof toolSchemaMap;

