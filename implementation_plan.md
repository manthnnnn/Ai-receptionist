# AI Voice Receptionist for Healthcare Clinics — Final Production Implementation Plan

> **Status**: DEFINITIVE — synthesized from PRD V1 (full text), PRD V2 (expanded UI), reference screenshots from the working prototype, and critical gap analysis of the previous failed build.

---

## 1. Source Material Reviewed

| Source | What It Contains | Status |
| :--- | :--- | :--- |
| **PRD V1** (35,742 bytes, conversation `9cbfc870`) | Full technical spec: LiveKit Agents + Supabase RLS + FastAPI + Bootstrap 5, complete DB DDL, RLS policies, atomic booking RPC, Python voice worker, function-calling tools, dashboard HTML, pricing model, Docker config | ✅ Read in full |
| **PRD V2** (referenced in this conversation) | Expanded spec: Next.js 14 App Router, TypeScript, Tailwind CSS, 14-table schema, doctor breaks/leaves/holidays, services table, conversation/message tables, Zod validation, patient verification protocols | ✅ Read in full |
| **Working Prototype Screenshots** (18 images, conversation `9cbfc870`) | Overview KPIs, Appointments table, Manual Booking modal, Doctors roster, Call Transcripts, Clinic FAQs, Live WebRTC Voice Tester, Inbound Phone Call Simulator, Tenant Switcher (Apollo Dental ↔ Radiance Dermatology) | ✅ All 18 reviewed |
| **Previous Build** (conversation `9cbfc870`, 145 steps) | FastAPI server running at `localhost:8000`, Swagger UI working, TwiML webhook returning valid XML, dashboard served with live data — but crashed due to API overload before completing Hindi/Marathi support | ✅ Transcript analyzed |
| **Current Workspace** | `c:\Users\ASUS\Downloads\ai clinic\` — **completely empty**, fresh start required | ✅ Verified |

---

## 2. UI Reference from the Working Prototype

The following screenshots are from the previous successful build and serve as the **exact visual target** for reconstruction:

````carousel
![Dashboard Overview — KPI cards showing Appointments (3), Total Calls (3), Booking Rate (33.3%), Avg Turn Latency (579ms), Direct COGS (₹11.63), Est. Revenue (₹1,950). Dark sidebar with Voice Pipeline info.](C:\Users\ASUS\.gemini\antigravity-ide\brain\af936d51-6612-4016-a755-9c1892d8bee1\ref_overview.png)
<!-- slide -->
![Appointments Table — Patient Name, Phone, Doctor badge, Date & Time, Source (AI Voice / Manual), Status (Confirmed), Actions (Reschedule / Cancel icons). "Atomic schedule locking • Zero race conditions" subtitle.](C:\Users\ASUS\.gemini\antigravity-ide\brain\af936d51-6612-4016-a755-9c1892d8bee1\ref_appointments.png)
<!-- slide -->
![Live AI Receptionist Tester — WebRTC Voice Pipeline modal with bi-directional audio stream canvas, live conversation transcript showing Caller question and AI response with 575ms roundtrip, quick prompt buttons.](C:\Users\ASUS\.gemini\antigravity-ide\brain\af936d51-6612-4016-a755-9c1892d8bee1\ref_voice_tester.png)
<!-- slide -->
![Inbound Phone Call Simulator — PSTN telephony flow modal showing Apollo Dental Clinic phone number, AI Receptionist greeting, "Click to Speak to AI" button, quick reply chips, and "End Phone Call" button.](C:\Users\ASUS\.gemini\antigravity-ide\brain\af936d51-6612-4016-a755-9c1892d8bee1\ref_phone_simulator.png)
````

---

## 3. Critical Decisions Resolved

> [!IMPORTANT]
> The following decisions were ambiguous across PRD V1 and V2. I have resolved each one based on production best practices.

| # | Decision | PRD V1 Said | PRD V2 Said | **Final Resolution** |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **Backend Framework** | FastAPI (Python) + LiveKit Agents | Next.js 14 API Routes | **Next.js 14 App Router** — single unified codebase for frontend + backend. Voice agent worker remains a separate Python process for LiveKit integration. |
| 2 | **Dashboard Framework** | Bootstrap 5 (static HTML + vanilla JS) | Tailwind CSS + React components | **Next.js 14 + Tailwind CSS + React** — component-based, SSR-capable, better DX than vanilla Bootstrap. |
| 3 | **Voice Pipeline** | LiveKit VoiceAssistant (Silero VAD + Deepgram + Groq + Cartesia) | OpenAI Realtime / Tool-calling | **Hybrid**: Next.js API handles tool orchestration + text chat. LiveKit Python worker handles real-time audio. Browser simulator uses Web Speech API + text-mode AI for zero-dependency demo. |
| 4 | **Seed Clinic Data** | Apollo Dental Clinic (3 doctors: Dr. Ashish Verma, Dr. Neha Kulkarni, Dr. Rohan Mehta) + Radiance Dermatology | Demo Clinic (Dr. Rahul Shah, Dr. Priya Khan) | **Both**: Apollo Dental Clinic (3 doctors) as primary + Radiance Dermatology (2 doctors) as secondary tenant for multi-tenancy demo. Matches working prototype exactly. |
| 5 | **Database Schema** | 7 tables (clinics, clinic_users, doctors, doctor_availability, appointments, call_logs, clinic_faqs) | 14 tables (adds clinic_settings, doctor_breaks, doctor_leaves, clinic_holidays, services, patients, conversations, messages) | **14 tables** from PRD V2. Full production coverage. |
| 6 | **Auth System** | Simple clinic_users with role field | Supabase Auth + profiles table with RBAC | **Supabase Auth** for production. In-memory fallback for local demo mode. |
| 7 | **Multilingual Support** | Not mentioned | Mentioned but not specified | **English default** with auto-detect for Hindi/Hinglish/Marathi. System prompt instructs AI to mirror caller's language. |

---

## 4. System Architecture

```
                                    PATIENT
                                       │
                  ┌────────────────────┴────────────────────┐
                  │                                         │
          PSTN / Mobile Call                        Browser (Demo / Dashboard)
                  │                                         │
                  ▼                                         ▼
       ┌───────────────────┐                     ┌───────────────────┐
       │   Twilio / SIP    │                     │ Browser Voice     │
       │  Inbound Webhook  │                     │ Simulator (Mic)   │
       └─────────┬─────────┘                     └─────────┬─────────┘
                 │                                         │
                 │          ┌──────────────────┐            │
                 └─────────▶│  Next.js 14 API  │◀───────────┘
                            │  Route Handlers  │
                            └────────┬─────────┘
                                     │
                              Tool Orchestration
                                     │
                                     ▼
                            ┌──────────────────┐
                            │   8 AI Tools     │
                            │  (Zod-validated) │
                            └────────┬─────────┘
                                     │
                              DB Queries / RPC
                                     │
                ┌────────────────────┼────────────────────┐
                ▼                    ▼                    ▼
       ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
       │  Supabase PG │    │ In-Memory    │    │  Scheduling  │
       │  (Production)│    │ Seed Store   │    │    Engine     │
       │  + RLS + RPC │    │ (Local Demo) │    │ (Slot Calc)  │
       └──────────────┘    └──────────────┘    └──────────────┘
                                     │
                                     ▼
                            ┌──────────────────┐
                            │ Next.js Frontend │
                            │  (React + TWind) │
                            └──────────────────┘
```

### Parallel Voice Pipeline (Production Telephony)

```
   Twilio PSTN Call ──▶ LiveKit SIP Bridge ──▶ LiveKit Server
                                                     │
                                              Audio Track (Opus)
                                                     │
                                                     ▼
                                         ┌──────────────────────┐
                                         │ Python Voice Worker  │
                                         │  Silero VAD (local)  │
                                         │  Deepgram STT        │
                                         │  Groq LLM + Tools    │
                                         │  Cartesia TTS        │
                                         └──────────┬───────────┘
                                                    │
                                              Tool Calls via
                                              Next.js API / DB
```

---

## 5. Complete Database Schema (14 Tables)

### DDL (`supabase/migrations/01_initial_schema.sql`)

```sql
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

-- 2. clinic_settings (per-tenant configuration)
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

-- 3. profiles (staff users, links to Supabase Auth)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT CHECK (role IN ('SUPER_ADMIN','CLINIC_ADMIN','DOCTOR','RECEPTIONIST')) DEFAULT 'RECEPTIONIST',
    created_at TIMESTAMPTZ DEFAULT NOW()
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
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. doctor_availability (weekly recurring schedule)
CREATE TABLE doctor_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    weekday INT CHECK (weekday BETWEEN 0 AND 6),  -- 0=Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL
);

-- 6. doctor_breaks (lunch, tea breaks per weekday)
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
    created_at TIMESTAMPTZ DEFAULT NOW()
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
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partial unique index: prevents double-booking for active appointments only
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

-- 13. conversations (groups messages per call)
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID REFERENCES call_logs(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. messages (individual dialogue turns)
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    speaker TEXT CHECK (speaker IN ('PATIENT','RECEPTIONIST','SYSTEM')) NOT NULL,
    content TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX idx_appointments_clinic_date ON appointments (clinic_id, start_at);
CREATE INDEX idx_appointments_doctor_date ON appointments (doctor_id, start_at) WHERE status = 'CONFIRMED';
CREATE INDEX idx_call_logs_clinic ON call_logs (clinic_id, created_at DESC);
CREATE INDEX idx_doctors_clinic ON doctors (clinic_id);
CREATE INDEX idx_patients_clinic_phone ON patients (clinic_id, phone);
CREATE INDEX idx_doctor_availability_doctor ON doctor_availability (doctor_id, weekday);
```

### Atomic Booking RPC (`supabase/migrations/03_atomic_booking.sql`)

```sql
CREATE OR REPLACE FUNCTION book_appointment_atomic(
    p_clinic_id UUID, p_doctor_id UUID,
    p_patient_name TEXT, p_patient_phone TEXT,
    p_start_at TIMESTAMPTZ, p_end_at TIMESTAMPTZ,
    p_notes TEXT DEFAULT NULL, p_source TEXT DEFAULT 'AI_VOICE'
) RETURNS JSON AS $$
DECLARE
    v_appointment_id UUID;
    v_patient_id UUID;
BEGIN
    -- Advisory lock prevents concurrent race conditions
    PERFORM pg_advisory_xact_lock(hashtext(p_doctor_id::text || p_start_at::text));

    -- Check for existing confirmed booking at this slot
    IF EXISTS (
        SELECT 1 FROM appointments
        WHERE doctor_id = p_doctor_id AND start_at = p_start_at AND status = 'CONFIRMED'
    ) THEN
        RETURN json_build_object('success', false, 'error_code', 'SLOT_ALREADY_BOOKED',
            'message', 'This time slot has already been reserved.');
    END IF;

    -- Upsert patient record
    INSERT INTO patients (clinic_id, name, phone)
    VALUES (p_clinic_id, p_patient_name, p_patient_phone)
    ON CONFLICT (clinic_id, phone) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_patient_id;

    -- Insert confirmed appointment
    INSERT INTO appointments (clinic_id, doctor_id, patient_id, patient_name, patient_phone,
        start_at, end_at, status, booking_source, notes)
    VALUES (p_clinic_id, p_doctor_id, v_patient_id, p_patient_name, p_patient_phone,
        p_start_at, p_end_at, 'CONFIRMED', p_source, p_notes)
    RETURNING id INTO v_appointment_id;

    RETURN json_build_object('success', true, 'appointment_id', v_appointment_id,
        'message', 'Appointment successfully confirmed.');
EXCEPTION
    WHEN unique_violation THEN
        RETURN json_build_object('success', false, 'error_code', 'SLOT_COLLISION',
            'message', 'A concurrent booking occurred for this slot.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 6. Scheduling Engine Algorithm

```
Available_Slots(doctor_id, target_date) =
    Generate_Slots(doctor_availability[weekday], consultation_duration_minutes)
    MINUS slots_overlapping(doctor_breaks[weekday])
    MINUS slots_overlapping(doctor_leaves WHERE start_at <= target_date <= end_at)
    MINUS slots_overlapping(clinic_holidays WHERE start_at <= target_date <= end_at)
    MINUS slots_matching(appointments WHERE doctor_id AND date(start_at) = target_date AND status = 'CONFIRMED')
```

**Example**: Dr. Ashish Verma, Monday
- Availability: 10:00 AM – 01:00 PM, 02:00 PM – 07:00 PM (from `doctor_availability`)
- Break: 01:00 PM – 02:00 PM (from `doctor_breaks`)
- Slot duration: 30 minutes
- Generated: `[10:00, 10:30, 11:00, 11:30, 12:00, 12:30, 14:00, 14:30, 15:00, 15:30, 16:00, 16:30, 17:00, 17:30, 18:00, 18:30]`
- Existing bookings at 11:00 and 14:30 → Remove those
- **Final available**: `[10:00, 10:30, 11:30, 12:00, 12:30, 14:00, 15:00, 15:30, 16:00, 16:30, 17:00, 17:30, 18:00, 18:30]`

---

## 7. AI Receptionist — 8 Tool Contracts

| # | Tool Name | Parameters | Returns | Patient ID Verify? |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `get_clinic_information` | `clinic_id` | Hours, address, parking, insurance, payment methods | No |
| 2 | `get_doctor_information` | `clinic_id`, `specialty?` | Doctor list with name, specialty, fee, duration, bio | No |
| 3 | `check_availability` | `clinic_id`, `doctor_id?`, `doctor_name?`, `target_date` | Array of available time slots `["10:00 AM", "10:30 AM", ...]` | No |
| 4 | `book_appointment` | `clinic_id`, `doctor_id`, `patient_name`, `patient_phone`, `slot_time`, `notes?` | `{success, appointment_id, message}` | No (new) |
| 5 | `get_patient_appointments` | `clinic_id`, `caller_phone`, `patient_name` | List of upcoming confirmed appointments | **Yes** |
| 6 | `cancel_appointment` | `clinic_id`, `appointment_id`, `caller_phone`, `patient_name`, `reason?` | `{success, message}` | **Yes** |
| 7 | `reschedule_appointment` | `clinic_id`, `appointment_id`, `caller_phone`, `patient_name`, `new_slot_time` | `{success, new_appointment_id, message}` | **Yes** |
| 8 | `transfer_to_human` | `clinic_id`, `call_id`, `reason` | `{handoff_number, escalation_logged}` | No |

### AI Safety Guardrails
- **No medical diagnosis, prescriptions, or health interpretations** — redirect to in-person doctor visit
- **Emergency keyword detection** (`chest pain`, `severe bleeding`, `can't breathe`, `heart attack`) → immediate `transfer_to_human` trigger
- **Concise telephone tone** — max 1–2 sentences per turn
- **Multilingual**: Mirror caller's language (English / Hindi / Hinglish / Marathi)

---

## 8. Complete File Manifest (~65 files)

```
ai-clinic/
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── next.config.js
├── .env.example
├── README.md
│
├── supabase/
│   ├── migrations/
│   │   ├── 01_initial_schema.sql          # 14 tables + indexes
│   │   ├── 02_rls_policies.sql            # RLS enable + clinic isolation
│   │   └── 03_atomic_booking.sql          # book_appointment_atomic RPC
│   └── seed.sql                           # Apollo Dental (3 docs) + Radiance Derm (2 docs)
│
├── src/
│   ├── types/
│   │   └── index.ts                       # All TypeScript interfaces
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                  # Browser Supabase client
│   │   │   └── server.ts                  # Server-side Supabase client
│   │   ├── store/
│   │   │   └── local-store.ts             # In-memory seed store (zero-config demo fallback)
│   │   ├── scheduling/
│   │   │   └── slot-engine.ts             # Availability - Breaks - Leaves - Holidays - Bookings
│   │   ├── ai/
│   │   │   ├── tools.ts                   # 8 tool implementations
│   │   │   ├── tool-schemas.ts            # Zod schemas for all tool parameters
│   │   │   ├── prompts.ts                 # System prompt + guardrails
│   │   │   └── orchestrator.ts            # LLM conversation + tool-calling loop
│   │   ├── twilio/
│   │   │   └── twiml.ts                   # TwiML response builders
│   │   └── utils.ts                       # Formatting, timezone helpers
│   │
│   ├── components/
│   │   ├── ui/                            # ~12 reusable primitives
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── modal.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── dropdown.tsx
│   │   │   ├── date-picker.tsx
│   │   │   └── loading.tsx
│   │   ├── layout/
│   │   │   ├── sidebar.tsx                # Dark sidebar with nav items + Voice Pipeline info
│   │   │   ├── header.tsx                 # Top bar: logo, tenant switcher, latency badge, action buttons
│   │   │   └── clinic-context.tsx         # Active clinic React context provider
│   │   ├── dashboard/
│   │   │   ├── kpi-card.tsx               # Animated metric card (count-up)
│   │   │   └── activity-feed.tsx          # Recent call activity stream
│   │   ├── appointments/
│   │   │   ├── appointment-table.tsx      # Data table with status badges + actions
│   │   │   └── booking-modal.tsx          # Manual booking modal (doctor select, date, slot chips, patient info)
│   │   ├── doctors/
│   │   │   ├── doctor-card.tsx            # Card with name, specialty, fee, slot duration, Active badge
│   │   │   └── schedule-editor.tsx        # Weekly availability grid + break editor
│   │   ├── calls/
│   │   │   ├── call-table.tsx             # Call log table with outcome badges
│   │   │   └── transcript-modal.tsx       # Full dialogue viewer with speaker labels + timestamps
│   │   ├── faqs/
│   │   │   └── faq-card.tsx               # FAQ card with category badge, question, answer, delete button
│   │   └── voice/
│   │       ├── voice-test-modal.tsx        # WebRTC Voice Tester (canvas waveform + transcript + quick prompts)
│   │       ├── phone-simulator-modal.tsx   # Inbound PSTN Call Simulator (phone icon, greeting, speak button)
│   │       └── audio-visualizer.tsx        # Canvas frequency-bar audio visualizer component
│   │
│   └── app/
│       ├── globals.css                    # Tailwind imports + custom design tokens
│       ├── layout.tsx                     # Root layout (Inter + Plus Jakarta Sans fonts)
│       ├── page.tsx                       # Marketing landing page (Hero, Features, Pricing, CTA)
│       │
│       ├── dashboard/
│       │   ├── layout.tsx                 # Dashboard shell (sidebar + header + clinic context)
│       │   ├── page.tsx                   # Overview (6 KPI cards + activity feed)
│       │   ├── appointments/
│       │   │   └── page.tsx               # Appointments table + booking modal
│       │   ├── doctors/
│       │   │   └── page.tsx               # Doctor roster cards + schedule editor
│       │   ├── calls/
│       │   │   └── page.tsx               # Call logs table + transcript viewer
│       │   ├── faqs/
│       │   │   └── page.tsx               # FAQ knowledge base manager
│       │   ├── voice-engine/
│       │   │   └── page.tsx               # Voice engine config + simulators
│       │   └── settings/
│       │       └── page.tsx               # Clinic profile, hours, holidays
│       │
│       └── api/
│           ├── clinic/
│           │   └── route.ts               # Clinic info + stats
│           ├── doctors/
│           │   └── route.ts               # Doctor CRUD
│           ├── availability/
│           │   └── route.ts               # Slot calculation endpoint
│           ├── appointments/
│           │   ├── route.ts               # List + Create (atomic)
│           │   └── [id]/
│           │       ├── cancel/route.ts
│           │       └── reschedule/route.ts
│           ├── patients/
│           │   └── route.ts               # Patient search
│           ├── calls/
│           │   └── route.ts               # Call logs + transcripts
│           ├── faqs/
│           │   └── route.ts               # FAQ CRUD
│           ├── ai/
│           │   ├── chat/route.ts          # AI conversation orchestrator
│           │   └── tools/route.ts         # Direct tool execution endpoint
│           └── twilio/
│               ├── voice/route.ts         # Inbound call TwiML
│               └── status/route.ts        # Call status callback
│
├── backend/                               # Python Voice Worker (separate process)
│   ├── requirements.txt
│   ├── agent/
│   │   ├── __init__.py
│   │   ├── voice_worker.py                # LiveKit VoiceAssistant pipeline
│   │   └── prompts.py                     # System prompt for voice
│   ├── tools/
│   │   ├── __init__.py
│   │   ├── clinic_tools.py                # Python tool implementations (calls Next.js API)
│   │   └── db_client.py                   # Supabase Python client
│   └── config.py                          # Pydantic Settings
│
├── Dockerfile
└── docker-compose.yml
```

---

## 9. Seed Data (Exactly Matching Prototype)

### Clinic 1: Apollo Dental Clinic
- **Address**: 45, 2nd Cross, Koramangala 4th Block, Bangalore - 560034
- **Phone**: +91-80-4567-8901
- **Hours**: Mon-Fri 9:30 AM – 7:30 PM, Sat 10:00 AM – 4:00 PM, Sun Closed
- **Doctors**:
  1. **Dr. Ashish Verma** — Endodontist & Root Canal Specialist, BDS MDS (Manipal), ₹750, 30 min slots
  2. **Dr. Neha Kulkarni** — Orthodontist & Clear Aligners, BDS MDS (AIIMS), ₹800, 30 min slots
  3. **Dr. Rohan Mehta** — General Dentist & Implantologist, BDS Fellowship in Implantology, ₹500, 30 min slots
- **Sample Appointments**: Priya Sundaram (root canal follow-up), Rahul Sharma (mild sensitivity), Ananya Iyer (braces consultation)
- **FAQs**: Consultation fees, Emergency dental pain policy, Clinic hours, Parking availability, Insurance accepted, Location directions, Payment methods, Post-extraction care

### Clinic 2: Radiance Dermatology & Laser Center
- **Doctors**:
  1. **Dr. Sunita Rao** — Cosmetic Dermatologist, MD (Dermatology), ₹1,000
  2. **Dr. Vikram Patel** — Laser Specialist, MD DVD (Skin), ₹900
- **Sample Appointments**: Kavita Reddy (acne scar laser consultation)
- **FAQs**: Laser treatment pricing, Skin consultation process, Pre-treatment preparation

---

## 10. Dashboard UI Specification (Pixel-Accurate to Prototype)

### Global Layout
- **Top Header Bar** (dark, ~60px): Robot icon + "Clinic Voice AI" + `Multi-Tenant SaaS` badge → Tenant Switcher dropdown → Green latency indicator `~575ms` → "Simulate Inbound Call (PSTN)" button → "Test Live Receptionist (WebRTC)" button
- **Sub-Header** (light, ~80px): Clinic name (h1) + RLS status line → "Voice Test Console" outlined button → "Manual Booking" teal solid button
- **Left Sidebar** (dark, ~200px): Navigation items with icons (Overview, Appointments, Doctors & Rosters, Call Transcripts, Clinic FAQs, Phone Numbers & SIP, Voice Engine) → Bottom: Voice Pipeline info panel (VAD, STT, LLM, TTS, Lock method)
- **Main Content Area** (light background with subtle gradient)

### Pages

**Overview** — 6 KPI metric cards in 3×2 grid:
1. APPOINTMENTS (count, "↗ Active slots")
2. TOTAL CALLS (count, "PSTN & WebRTC")
3. BOOKING RATE (percentage, "AI conversion")
4. AVG TURN LATENCY (ms value in green, "✓ Sub-800ms")
5. DIRECT COGS (₹ value in orange, "₹3.23 / min rate")
6. EST. REVENUE (₹ value in teal, "Consultation fees")

**Appointments** — "Confirmed Appointments" heading + "Atomic schedule locking • Zero race conditions" subtitle. Date filter + "+ New Booking" button. Table columns: Patient Name (+ notes), Phone, Doctor (badge), Date & Time, Source (AI Voice / Manual badge), Status (Confirmed / Cancelled badge), Actions (reschedule ↻ + cancel ⊗ icons).

**Doctors & Rosters** — "Clinic Doctors & Roster" heading + "Manage active practitioners, fees, and slot durations" subtitle. "+ Add Doctor" button. Card grid: each card has user icon, Active badge, doctor name, specialty (teal text), credentials, consultation fee (₹), slot duration.

**Call Transcripts** — Table: Time, Caller Phone, Duration, Intent, Outcome badge, "View" transcript link. Transcript modal shows full dialogue with speaker labels and timestamps.

**Clinic FAQs** — "Clinic Knowledge Base & FAQs" heading + "AI receptionist ground truth policies" subtitle. "+ Add FAQ" button. Cards with category badge (CONSULTATION FEE, EMERGENCY, TIMINGS, PARKING, etc.), bold question, answer text, delete icon.

**Voice Engine** — Configuration page + embedded voice test console modal and inbound phone call simulator modal.

---

## 11. Execution Phases

| Phase | Scope | Files | Checkpoint |
| :--- | :--- | :--- | :--- |
| **1. Foundation** | Next.js 14 init, Tailwind config, design tokens, fonts, TypeScript types, Zod schemas, utility functions | ~12 files | `npm run dev` launches, empty shell renders |
| **2. Database** | SQL migrations (14 tables, RLS, atomic RPC), seed data, in-memory local store | ~5 files | Local store returns seed doctors and appointments |
| **3. Scheduling & Tools** | Slot calculation engine, all 8 AI tool implementations, system prompts, LLM orchestrator | ~8 files | `GET /api/availability?doctor=ashish&date=2026-09-01` returns computed slots |
| **4. API Routes** | All REST endpoints: clinic, doctors, appointments (CRUD + atomic), calls, FAQs, patients, AI chat | ~12 files | All API endpoints respond with correct data |
| **5. Dashboard UI** | All React components, all 6 dashboard pages, modals, tables, cards, interactive elements | ~25 files | Full dashboard navigable with live data |
| **6. Voice Simulators** | WebRTC voice tester modal (canvas + transcript), Inbound PSTN call simulator modal, Web Speech API integration | ~5 files | Speak to AI in browser, get tool execution + TTS response |
| **7. Verify & Polish** | Build verification, end-to-end test flows, responsive polish, final walkthrough | — | `npm run build` passes, all scenarios work |

---

## 12. Verification Scenarios

| # | Scenario | Steps | Expected Result |
| :--- | :--- | :--- | :--- |
| 1 | **Book appointment** | Open Voice Tester → "Book Dr. Verma tomorrow at 10 AM for Rahul, phone 98765 43210" | AI checks availability → creates appointment → appears in Appointments table |
| 2 | **Double-booking block** | Book same slot again | AI returns "This slot is already booked" + offers alternatives |
| 3 | **Cancel with verification** | "Cancel my appointment" → AI asks name/phone → matches → cancels | Status changes to CANCELLED, row greys out |
| 4 | **Reschedule** | "Reschedule to 3 PM" → verifies identity → checks 3 PM slot → books | Old slot freed, new slot confirmed |
| 5 | **FAQ retrieval** | "What is the consultation fee?" | AI returns "₹500 for general, ₹750-₹800 for specialists" |
| 6 | **Emergency escalation** | "I have severe chest pain" | AI triggers `transfer_to_human`, logs escalation |
| 7 | **Tenant isolation** | Switch from Apollo Dental to Radiance Dermatology | Appointments, doctors, FAQs completely change |
| 8 | **Manual booking** | Click "Manual Booking" → select Dr. Verma → pick date → select slot chip → enter patient info → confirm | Slot chip shows available times, booking creates appointment |
| 9 | **Build verification** | `npm run build` | Zero errors, zero warnings |
