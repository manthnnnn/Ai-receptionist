export type UserRole = 'SUPER_ADMIN' | 'CLINIC_ADMIN' | 'DOCTOR' | 'RECEPTIONIST';

export interface Clinic {
  id: string;
  name: string;
  address: string;
  phone_number: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface OperatingHours {
  mon: string;
  tue: string;
  wed: string;
  thu: string;
  fri: string;
  sat: string;
  sun: string;
}

export interface ClinicSettings {
  id: string;
  clinic_id: string;
  operating_hours: OperatingHours;
  ai_greeting: string;
  ai_enabled: boolean;
  primary_handoff_number: string;
  backup_handoff_number?: string;
}

export interface Profile {
  id: string;
  clinic_id: string;
  full_name: string;
  role: UserRole;
  email?: string;
  created_at: string;
}

export interface Doctor {
  id: string;
  clinic_id: string;
  name: string;
  specialty: string;
  description: string;
  consultation_duration_minutes: number;
  consultation_fee: number;
  is_active: boolean;
  created_at: string;
}

export interface DoctorAvailability {
  id: string;
  doctor_id: string;
  weekday: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  start_time: string; // e.g. "10:00"
  end_time: string;   // e.g. "19:00"
}

export interface DoctorBreak {
  id: string;
  doctor_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
}

export interface DoctorLeave {
  id: string;
  doctor_id: string;
  start_at: string;
  end_at: string;
  reason: string;
}

export interface ClinicHoliday {
  id: string;
  clinic_id: string;
  start_at: string;
  end_at: string;
  reason: string;
}

export interface Service {
  id: string;
  clinic_id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  is_active: boolean;
}

export interface Patient {
  id: string;
  clinic_id: string;
  name: string;
  phone: string;
  email?: string;
  created_at: string;
}

export type AppointmentStatus = 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
export type BookingSource = 'AI_VOICE' | 'MANUAL' | 'WEBRTC_DEMO';

export type NotificationStatus = 'NOT_SENT' | 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED';

export interface NotificationLog {
  channel: 'SMS' | 'WHATSAPP';
  status: NotificationStatus;
  sent_at: string;
  recipient_phone: string;
  message_preview: string;
  provider: 'TWILIO' | 'GUPSHUP' | 'SIMULATED';
}

export interface Appointment {
  id: string;
  clinic_id: string;
  doctor_id: string;
  doctor_name?: string;
  doctor_specialty?: string;
  patient_id?: string;
  service_id?: string;
  patient_name: string;
  patient_phone: string;
  start_at: string; // ISO 8601 string
  end_at: string;
  status: AppointmentStatus;
  booking_source: BookingSource;
  notes?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  sms_status?: NotificationStatus;
  whatsapp_status?: NotificationStatus;
  last_notified_at?: string;
  notification_logs?: NotificationLog[];
  created_at: string;
}

export type CallOutcome = 'BOOKED' | 'FAQ_ANSWERED' | 'RESCHEDULED' | 'CANCELLED' | 'ESCALATED' | 'ABANDONED' | 'ERROR';

export interface DialogueTurn {
  turn_index: number;
  speaker: 'user' | 'ai';
  text: string;
  tool_called?: string;
  latency_ms?: number;
  language?: 'en' | 'hi' | 'mr';
  timestamp: string;
}

export interface CallLog {
  id: string;
  clinic_id: string;
  caller_phone: string;
  started_at: string;
  ended_at?: string;
  duration_seconds: number;
  call_intent?: string;
  outcome: CallOutcome;
  appointment_id?: string;
  transfer_status?: string;
  created_at: string;
  transcript_preview?: string;
  dialogue_turns?: DialogueTurn[];
  total_latency_ms?: number;
  detected_language?: 'en' | 'hi' | 'mr';
}

export interface Message {
  id: string;
  conversation_id: string;
  speaker: 'PATIENT' | 'RECEPTIONIST' | 'SYSTEM';
  content: string;
  timestamp: string;
  latency_ms?: number;
  tool_called?: string;
  tool_result?: unknown;
}

export interface Conversation {
  id: string;
  call_id: string;
  created_at: string;
  messages?: Message[];
}

export interface ClinicFAQ {
  id: string;
  clinic_id: string;
  category: string;
  question: string;
  answer: string;
  created_at: string;
}

export interface ClinicStats {
  appointments_count: number;
  total_calls_count: number;
  booking_rate_percentage: number;
  avg_turn_latency_ms: number;
  direct_cogs_inr: number;
  est_revenue_inr: number;
}
