# Clinic Voice AI — 24/7 AI Voice Receptionist for Healthcare Clinics (Multi-Tenant SaaS)

A cloud-native SaaS platform built for outpatient medical, dental, and aesthetic clinics. The system fields incoming telephone calls via Twilio/SIP, detects caller intent, answers clinic FAQs, verifies doctor availability, and atomically books/reschedules/cancels appointments without race condition double-bookings.

---

## Key Features

1. **Sub-800ms Streaming Voice Pipeline**: Silero VAD (local interruption barge-in), Deepgram Nova-2 (STT), Groq LLaMA 3.1 8B (LLM), and Cartesia Sonic (TTS).
2. **Atomic Double-Booking Protection**: PostgreSQL transactional advisory locks (`pg_advisory_xact_lock`) and partial unique indexes prevent concurrent callers from reserving identical doctor slots.
3. **Multi-Tenant Row-Level Security (RLS)**: Complete clinic data isolation by `clinic_id`.
4. **Interactive In-Browser Voice Simulator**: Test speech recognition, natural voice synthesis, and real-time tool execution directly in the dashboard without requiring an active Twilio number.
5. **Inbound PSTN Phone Call Simulator**: Experience the full cellular phone call flow with realistic caller audio and quick-reply triggers.
6. **Complete Clinic Management Dashboard**: Real-time KPI cards, Appointments table with conflict detection, Doctor roster & weekly schedules, Call Transcripts, Knowledge Base FAQs, and Phone/SIP settings.

---

## Quickstart

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the marketing page, or [http://localhost:3000/dashboard](http://localhost:3000/dashboard) to enter the Clinic Dashboard immediately.

---

## API Endpoints

- `GET /api/clinic` - Clinic information, settings, and KPI statistics
- `GET /api/doctors` - Doctor roster & fees
- `GET /api/availability` - Doctor slot availability calculation (Availability - Breaks - Leaves - Holidays - Bookings)
- `GET /api/appointments` - Filterable appointments list
- `POST /api/appointments` - Atomic appointment booking with collision locking
- `POST /api/appointments/:id/cancel` - Appointment cancellation with reason
- `POST /api/appointments/:id/reschedule` - Appointment rescheduling
- `GET /api/calls` - Telephony call logs and transcripts
- `GET /api/faqs` - Clinic FAQ knowledge base
- `POST /api/ai/chat` - AI receptionist conversational turn endpoint
- `POST /api/ai/tools` - Direct AI tool execution endpoint
- `POST /api/twilio/voice` - Inbound call TwiML response webhook
- `POST /api/twilio/status` - Call completion status callback

---

## Database Migrations (Supabase)

The SQL schema and stored procedures are in `supabase/migrations/`:
- `01_initial_schema.sql` (14 tables, constraints, and indexes)
- `02_rls_policies.sql` (Row-Level Security multi-tenant policies)
- `03_atomic_booking.sql` (Atomic booking stored procedure with `pg_advisory_xact_lock`)
- `seed.sql` (Seed data for Apollo Dental Clinic & Radiance Dermatology)
