-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. clinics (tenants)
CREATE TABLE clinics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    phone_number TEXT,
    timezone TEXT DEFAULT 'Asia/Kolkata',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. clinic_settings
CREATE TABLE clinic_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    operating_hours JSONB DEFAULT '{"mon":"09:30-19:30","tue":"09:30-19:30","wed":"09:30-19:30","thu":"09:30-19:30","fri":"09:30-19:30","sat":"10:00-16:00","sun":"closed"}'::jsonb,
    ai_greeting TEXT DEFAULT 'Hello! Thank you for calling. How can I help you today?',
    ai_enabled BOOLEAN DEFAULT TRUE,
    primary_handoff_number TEXT,
    backup_handoff_number TEXT,
    UNIQUE(clinic_id)
);

-- 3. profiles (links to Supabase Auth users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT CHECK (role IN ('SUPER_ADMIN','CLINIC_ADMIN','DOCTOR','RECEPTIONIST')) DEFAULT 'RECEPTIONIST',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. doctors
CREATE TABLE doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    description TEXT,
    consultation_duration_minutes INT DEFAULT 30,
    consultation_fee NUMERIC(10,2) DEFAULT 500.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. doctor_availability (weekly recurring schedule)
CREATE TABLE doctor_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    weekday INT CHECK (weekday BETWEEN 0 AND 6), -- 0=Sunday, 1=Monday...
    start_time TIME NOT NULL,
    end_time TIME NOT NULL
);

-- 6. doctor_breaks (lunch / tea breaks per weekday)
CREATE TABLE doctor_breaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    weekday INT CHECK (weekday BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL
);

-- 7. doctor_leaves (date-range absences)
CREATE TABLE doctor_leaves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    reason TEXT
);

-- 8. clinic_holidays
CREATE TABLE clinic_holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    reason TEXT NOT NULL
);

-- 9. services
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    duration_minutes INT DEFAULT 30,
    price NUMERIC(10,2),
    is_active BOOLEAN DEFAULT TRUE
);

-- 10. patients
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(clinic_id, phone)
);

-- 11. appointments (with double-booking protection)
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id),
    service_id UUID REFERENCES services(id),
    patient_name TEXT NOT NULL,
    patient_phone TEXT NOT NULL,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    status TEXT CHECK (status IN ('CONFIRMED','CANCELLED','COMPLETED','NO_SHOW')) DEFAULT 'CONFIRMED',
    booking_source TEXT CHECK (booking_source IN ('AI_VOICE','MANUAL','WEBRTC_DEMO')) DEFAULT 'AI_VOICE',
    notes TEXT,
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partial unique index to strictly guarantee zero double-booking on active slots
CREATE UNIQUE INDEX unique_active_doctor_slot 
    ON appointments (doctor_id, start_at) 
    WHERE status = 'CONFIRMED';

-- 12. call_logs
CREATE TABLE call_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    caller_phone TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_seconds INT DEFAULT 0,
    call_intent TEXT,
    outcome TEXT CHECK (outcome IN ('BOOKED','FAQ_ANSWERED','RESCHEDULED','CANCELLED','ESCALATED','ABANDONED','ERROR')),
    appointment_id UUID REFERENCES appointments(id),
    transfer_status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. conversations
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID REFERENCES call_logs(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    speaker TEXT CHECK (speaker IN ('PATIENT','RECEPTIONIST','SYSTEM')) NOT NULL,
    content TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 15. clinic_faqs
CREATE TABLE clinic_faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Query Performance Indexes
CREATE INDEX idx_appointments_clinic_date ON appointments (clinic_id, start_at);
CREATE INDEX idx_appointments_doctor_date ON appointments (doctor_id, start_at) WHERE status = 'CONFIRMED';
CREATE INDEX idx_call_logs_clinic ON call_logs (clinic_id, created_at DESC);
CREATE INDEX idx_doctors_clinic ON doctors (clinic_id);
CREATE INDEX idx_patients_clinic_phone ON patients (clinic_id, phone);
CREATE INDEX idx_doctor_availability_doctor ON doctor_availability (doctor_id, weekday);
CREATE INDEX idx_clinic_faqs_clinic ON clinic_faqs (clinic_id);
