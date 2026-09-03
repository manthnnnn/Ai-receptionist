# AI Clinic Receptionist — Production-Ready MVP Architecture: Gap Analysis & 11-Phase Roadmap

> **Audit Date**: 2026-08-31  
> **Inspection Mode**: Comprehensive Codebase Analysis & Pre-Execution Design  
> **Repository**: [https://github.com/manthnnnn/Ai-receptionist.git](https://github.com/manthnnnn/Ai-receptionist.git) (`main` branch)

---

## Part 1: Comprehensive Codebase & Architecture Analysis

---

### A. Current Status
The project possesses a working **simulated MVP foundation**. 

1. **Frontend UI**: Built in Next.js 14 App Router, featuring an Apple iOS 18 / iPhone 16 Pro in-call simulation modal, interactive appointments roster, doctor schedules, call transcript inspector with audio playback, clinic switcher, and FAQ manager.
2. **AI Tool & Scheduling Engine**: 8 Zod-validated clinic tools (`get_clinic_information`, `get_doctor_information`, `check_availability`, `book_appointment`, `get_patient_appointments`, `reschedule_appointment`, `cancel_appointment`, `transfer_to_human`) with atomic slot calculations (deducting breaks, leaves, and holidays).
3. **Database Schema & Migrations**: 14 tables defined in `supabase/migrations/20240830000001_initial_schema.sql`, RLS policies in `20240830000002_rls_policies.sql`, and atomic locking functions (`book_appointment_atomic`, `cancel_appointment_atomic`, `reschedule_appointment_atomic`) in `20240830000003_atomic_booking.sql`.
4. **Telephony & Real-Time Worker Foundation**: TwiML voice/gather webhooks in Next.js App Router; Python LiveKit voice worker (`backend/agent/voice_worker.py`) with Silero VAD, Deepgram STT, Groq LLM, and Cartesia TTS.
5. **Local Store Engine**: Robust 14-table in-memory fallback store (`src/lib/store/local-store.ts`) ensuring zero-config offline execution.

---

### B. Tasks Completed

- **Task 1 — Multi-Tenant PostgreSQL Schema (14 Tables & DDL)**:
  - Tables 1–14 (`clinics`, `clinic_settings`, `profiles`, `doctors`, `doctor_availability`, `doctor_breaks`, `doctor_leaves`, `clinic_holidays`, `services`, `patients`, `appointments`, `call_logs`, `conversations`, `messages`) created with indexes and foreign keys.
- **Task 2 — Core Scheduling & Conflict Resolution Engine**:
  - `src/lib/scheduling/slot-engine.ts` calculates availability subtracting doctor breaks, leaves, clinic holidays, and confirmed bookings.
- **Task 3 — 8 Zod-Validated AI Tool Contracts & Alternative Negotiation**:
  - `src/lib/ai/tools.ts` and `src/lib/ai/tool-schemas.ts` implement all 8 core tools. On slot collision, `book_appointment` automatically computes and offers 3 nearest available slots.
- **Task 4 — iPhone 16 Pro Web Voice Simulator with AEC**:
  - `src/components/voice/phone-simulator-modal.tsx` with hands-free continuous dialogue, live duration timer, keypad, mute toggle, and speaker control.
- **Task 5 — Dual-Tier Audio Playback & Neural Voice Engine**:
  - `/api/tts` uses Microsoft Edge Neural TTS with browser `window.speechSynthesis` fallback.
- **Task 6 — Services, Doctor Leaves, Holidays, & Patient History APIs**:
  - `/api/services`, `/api/doctors/[id]/leaves`, `/api/holidays`, `/api/patients/[id]`, `/api/analytics`, `/api/export`, and `/api/webhooks/outbound` implemented and passing 100% of contract tests.
- **Task 7 — Multi-Service Docker Orchestration**:
  - Root `Dockerfile`, `backend/Dockerfile`, and `docker-compose.yml` configured.

---

### C. Tasks Partially Complete

1. **Database Persistence vs. In-Memory Store**:
   - *What exists*: SQL RPC `book_appointment_atomic` exists in migrations.
   - *What is missing*: Next.js API routes currently execute against in-memory `localStore`. On serverless deployments (Vercel) or server restarts, in-memory state resets. APIs must query live Supabase PostgreSQL when cloud credentials are configured.
2. **Real PSTN Telephony (Twilio)**:
   - *What exists*: `/api/twilio/voice` and `/api/twilio/gather` generate valid TwiML `<Say>`/`<Gather>`.
   - *What is missing*: Cryptographic webhook signature verification (`X-Twilio-Signature`), Media Streams WebSocket ingress, and SIP trunk binding for autonomous 24/7 backend call handling without a browser.
3. **Audio Recording Storage & Retention Policy**:
   - *What exists*: Twilio `RecordingUrl` captured in `/api/twilio/status`.
   - *What is missing*: Audio files are not uploaded to private Supabase Storage buckets; clinic recording consent policy (`ALWAYS` / `CONSENT_REQUIRED` / `DISABLED`) and signed URL generation are not implemented.
4. **Multilingual Voice Dynamic Switching**:
   - *What exists*: Prompts and TTS support English, Hindi, and Marathi.
   - *What is missing*: Automatic runtime spoken-language detection and mid-call code-switching without UI button toggles.
5. **Role-Based Access Control (RBAC)**:
   - *What exists*: `profiles.role` enum exists (`SUPER_ADMIN`, `CLINIC_ADMIN`, `DOCTOR`, `RECEPTIONIST`).
   - *What is missing*: Separate `/admin` vs `/clinic` routes, Supabase Auth session synchronization trigger, and Super Admin RLS bypass policies.

---

### D. Tasks Not Started

- Dedicated **Platform Admin Dashboard** (`/admin`) for SaaS owners (global clinic directory, global billing/usage metrics, system health, and cross-clinic call monitoring).
- Standalone **Patient Records & Timeline Page** (`/clinic/patients` and `/clinic/patients/[id]`).
- **Supabase Auth Login & Passwordless Magic Link flow** with role-based redirection.
- **Private Supabase Storage Bucket setup** (`call-recordings`) with expiring signed URLs.

---

### E. Database Changes Required

1. **Storage Bucket & Security**:
   - Create private storage bucket: `call-recordings`.
   - Add storage RLS policy allowing authenticated clinic staff to download audio only if `bucket_id = 'call-recordings'` and path prefix matches their `clinic_id`.
2. **Clinic Recording Settings**:
   - Add `recording_policy TEXT CHECK (recording_policy IN ('ALWAYS', 'CONSENT_REQUIRED', 'DISABLED')) DEFAULT 'CONSENT_REQUIRED'` to `clinic_settings`.
3. **Super Admin RLS Bypass Policies**:
   - Update `20240830000002_rls_policies.sql` to include `OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'SUPER_ADMIN'` across all 14 tables.
4. **Auth User Synchronization Trigger**:
   - PostgreSQL trigger on `auth.users` to automatically create/update `public.profiles` on signup.

---

### F. Backend / API Changes Required

1. **Database Proxy Layer (`src/lib/db/`)**:
   - Create a unified data layer that queries Supabase PostgreSQL when credentials exist, with automatic fallback to `localStore` for local development.
2. **Atomic RPC Integration**:
   - Update `/api/appointments` and `src/lib/ai/tools.ts` to execute `supabase.rpc('book_appointment_atomic', ...)` directly.
3. **Twilio Webhook Security Middleware**:
   - Add `validateTwilioWebhook(req)` verifying `X-Twilio-Signature` against `TWILIO_AUTH_TOKEN`.
4. **Recording Signed URL API (`GET /api/calls/[id]/recording`)**:
   - Generates 1-hour time-limited signed URL from Supabase Storage for authorized clinic staff.
5. **Platform Admin APIs (`/api/admin/...`)**:
   - Global endpoints: `/api/admin/clinics`, `/api/admin/stats`, `/api/admin/system-health`.

---

### G. Frontend / Page Changes Required

1. **Platform Super Admin Suite (`/admin`)**:
   - `/admin/page.tsx`: Global MRR, active clinics, total telephony minutes, system health.
   - `/admin/clinics/page.tsx`: Clinic management (Activate, Suspend, Provision Phone Numbers).
   - `/admin/calls/page.tsx`: Global real-time call telemetry stream.
2. **Clinic Dashboard Suite (`/clinic`)**:
   - Refactor existing `/dashboard/*` routes to clean `/clinic/*` routes with strict tenant-scoped context.
   - Add `/clinic/patients/page.tsx` (Patient directory) and `/clinic/patients/[id]/page.tsx` (Medical visit timeline).
   - Add `/clinic/recordings/page.tsx` (Dedicated call recordings player).
3. **Authentication Pages**:
   - `/login/page.tsx`: Email / Password & Magic Link login with role-based routing.

---

### H. Voice / Telephony Changes Required

1. **PSTN Inbound Routing**:
   - Configure Twilio Phone Number Voice URL $\rightarrow$ `https://<domain>/api/twilio/voice`.
2. **SIP Trunking / Media Streams Bridge**:
   - Connect Twilio Elastic SIP Trunk to LiveKit SIP Ingress for sub-300ms bidirectional WebRTC audio.
3. **Independent 24/7 Voice Daemon**:
   - Deploy `backend/agent/voice_worker.py` in containerized cloud infrastructure so calls answer automatically without requiring an active browser session.

---

### I. Auth / RLS Changes Required

1. **Supabase Auth JWT Custom Claims**:
   - Inject `clinic_id` and `user_role` into `auth.jwt()` via Postgres Auth Hooks.
2. **Server-Side Route Middleware (`src/middleware.ts`)**:
   - Intercept `/admin/*` $\rightarrow$ require `SUPER_ADMIN` role.
   - Intercept `/clinic/*` $\rightarrow$ require `CLINIC_ADMIN` / `STAFF` role matching requested tenant.

---

### J. Storage / Recording Changes Required

1. **Direct Audio Download & Ingestion**:
   - Background worker downloads MP3 stream from Twilio / LiveKit upon call completion.
   - Uploads binary stream to Supabase Storage: `call-recordings/${clinic_id}/${call_id}.mp3`.
2. **Signed URL Authorization**:
   - Secure access: clinic users receive signed URLs with 3600s TTL. Never expose public S3/Supabase URLs.

---

### K. Multilingual Changes Required

1. **Automatic Language Classifier**:
   - First 3 seconds of caller speech analyzed by Deepgram / Whisper language detector.
   - Automatically sets conversation context to `'mr'`, `'hi'`, or `'en'`.
2. **Phonetic Medical Glossary**:
   - Dictionary of Devanagari pronunciations for clinical terms (e.g., Root Canal $\rightarrow$ रूट कॅनल, Orthodontics $\rightarrow$ दातांचे क्लिप्स/ऑर्थोडॉन्टिक्स).

---

### L. Testing Required

1. **Unit Tests**: Availability calculations, break subtractions, leave blackouts, date-time parsers.
2. **Integration Tests**: Supabase atomic booking RPC concurrency, Twilio signature validation, signed URL generation.
3. **End-to-End Tests**: Full PSTN phone call from mobile phone $\rightarrow$ Maya greets in English $\rightarrow$ switches to Marathi $\rightarrow$ books appointment $\rightarrow$ dispatches WhatsApp $\rightarrow$ records call in Supabase.

---

### M. Deployment Requirements

1. **Web Layer**: Vercel / Docker container running Next.js 14 App Router.
2. **Voice Worker Layer**: Fly.io / AWS ECS container running Python 3.11 LiveKit Agent Worker.
3. **Database & Storage**: Supabase Cloud (Managed PostgreSQL + Storage).

---

### N. Environment Variables Required

```env
# Next.js & Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# AI & LLM Providers
GROQ_API_KEY=gsk_...
OPENAI_API_KEY=sk-...

# Telephony (Twilio)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# Real-Time Voice Pipeline (LiveKit & Speech)
LIVEKIT_URL=wss://...livekit.cloud
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
DEEPGRAM_API_KEY=...
CARTESIA_API_KEY=...
```

---

### O. Risks & Technical Challenges

1. **Twilio HTTP Gather Latency**: Standard HTTP `<Gather>` takes ~2s per turn.  
   *Mitigation*: Transition to LiveKit SIP Ingress / WebRTC streaming for sub-300ms real-time audio.
2. **Acoustic Echo & Self-Interruption**: Microphone capturing speaker output.  
   *Mitigation*: Silero VAD with speech activity thresholds and software echo cancellation.
3. **Database Concurrency on Popular Doctors**: Multiple callers booking identical slots simultaneously.  
   *Mitigation*: PostgreSQL advisory transaction locks (`pg_advisory_xact_lock`) inside `book_appointment_atomic`.

---

### P. Recommended Implementation Order

```
[Phase 1: Auth & Roles] ──> [Phase 2: Admin/Clinic Dashboards] ──> [Phase 3: Database & RPC]
                                                                          │
[Phase 6: Multilingual] <── [Phase 5: Audio Storage] <── [Phase 4: Call Logging]
          │
          ▼
[Phase 7: Real Telephony] ──> [Phase 8: Human Handoff] ──> [Phase 9: Security] ──> [Phase 10: E2E Testing] ──> [Phase 11: Deployment]
```

---

## Part 2: 11-Phase Implementation Roadmap

---

### PHASE 1 — Authentication, RBAC & Role Routing
- **Files to Modify/Create**:
  - `src/middleware.ts` [NEW] — Route guard enforcing `/admin` vs `/clinic` access.
  - `src/app/(auth)/login/page.tsx` [NEW] — Supabase Auth login UI.
  - `src/lib/auth/session.ts` [NEW] — Server-side session & role validator.
- **Database Migrations**:
  - `supabase/migrations/20240830000004_auth_triggers.sql` — Auth user creation trigger & custom claims hook.
- **APIs**:
  - `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/session`.
- **Dependencies**: `@supabase/ssr`, `@supabase/supabase-js`.
- **Tests**: Verify `SUPER_ADMIN` accesses `/admin`, `CLINIC_ADMIN` restricted to `/clinic`, unauthenticated redirected to `/login`.
- **Definition of Done**: Role-based routing active; direct URL tampering blocked at edge middleware.

---

### PHASE 2 — Platform Admin vs Clinic Dashboards Restructuring
- **Files to Modify/Create**:
  - `src/app/admin/page.tsx` [NEW] — Global platform overview.
  - `src/app/admin/clinics/page.tsx` [NEW] — Clinic provisioning & status manager.
  - `src/app/clinic/layout.tsx` [NEW] — Tenant-scoped clinic layout.
  - `src/app/clinic/dashboard/page.tsx` [NEW] — Clinic KPI overview.
  - `src/app/clinic/patients/page.tsx` [NEW] — Patient directory and visit history.
- **Database Migrations**: None.
- **APIs**:
  - `GET /api/admin/clinics`, `POST /api/admin/clinics`, `GET /api/clinic/stats`.
- **Tests**: Verify Clinic A dashboard displays zero Clinic B data; Admin dashboard shows global totals.
- **Definition of Done**: Clean separation of company admin vs customer clinic URL spaces.

---

### PHASE 3 — Supabase Cloud Database & Atomic RPC Direct Binding
- **Files to Modify/Create**:
  - `src/lib/db/client.ts` [NEW] — Dual-mode database driver (Supabase Postgres with localStore fallback).
  - `src/app/api/appointments/route.ts` [MODIFY] — Execute `book_appointment_atomic` RPC.
  - `src/app/api/appointments/[id]/cancel/route.ts` [MODIFY] — Execute `cancel_appointment_atomic`.
  - `src/app/api/appointments/[id]/reschedule/route.ts` [MODIFY] — Execute `reschedule_appointment_atomic`.
- **Database Migrations**:
  - Verify `supabase/migrations/20240830000003_atomic_booking.sql` applied to cloud database.
- **APIs**:
  - `POST /api/appointments`, `POST /api/appointments/[id]/reschedule`, `POST /api/appointments/[id]/cancel`.
- **Tests**: 10 concurrent requests to book same slot on cloud Supabase: exactly 1 succeeds, 9 fail with `SLOT_ALREADY_BOOKED`.
- **Definition of Done**: Appointments persist across server restarts and serverless lambdas.

---

### PHASE 4 — Call Lifecycle & Telemetry Persistence
- **Files to Modify/Create**:
  - `src/app/api/calls/route.ts` [MODIFY] — Direct Postgres read/write.
  - `src/app/api/conversations/route.ts` [MODIFY] — Direct Tables 13 & 14 Postgres persistence.
  - `src/app/api/twilio/status/route.ts` [MODIFY] — Idempotent status handler with exponential retry.
- **Database Migrations**: None.
- **APIs**:
  - `POST /api/calls`, `GET /api/calls`, `GET /api/conversations?call_id=xxx`.
- **Tests**: Verify call start, speech turns, duration (s), and terminal outcome stored in Postgres.
- **Definition of Done**: Full dialogue and telemetry visible on `/clinic/calls` immediately following a call.

---

### PHASE 5 — Audio Recording Storage & Policy Engine
- **Files to Modify/Create**:
  - `src/lib/storage/recording-uploader.ts` [NEW] — Streams audio to Supabase Storage bucket.
  - `src/app/api/calls/[id]/recording/route.ts` [NEW] — Generates signed URL with 3600s TTL.
  - `src/app/clinic/calls/page.tsx` [MODIFY] — Connect `CallAudioPlayer` to signed URL endpoint.
- **Database Migrations**:
  - `supabase/migrations/20240830000005_storage_policies.sql` — Private `call-recordings` bucket & RLS.
- **APIs**:
  - `GET /api/calls/[id]/recording`, `POST /api/webhooks/recording-callback`.
- **Tests**: Verify non-authenticated request receives 401; authenticated clinic staff receives playable signed URL.
- **Definition of Done**: Audio stored in private cloud storage; playback integrated into dashboard transcripts.

---

### PHASE 6 — Multilingual Voice Intelligence (MR / HI / EN)
- **Files to Modify/Create**:
  - `src/lib/ai/language-detector.ts` [NEW] — Runtime language classifier.
  - `src/lib/ai/prompts.ts` [MODIFY] — Refine Marathi, Hindi, and Indian English tone & brevity rules.
  - `src/app/api/tts/route.ts` [MODIFY] — Edge Neural TTS + Cartesia streaming pipeline.
- **Database Migrations**: None.
- **APIs**:
  - `POST /api/tts`, `POST /api/ai/chat`.
- **Tests**: Test inputs in Marathi (*"मला उद्या डॉक्टर वर्मांची भेट हवी आहे"*), Hindi (*"कल सुबह 11 बजे का स्लॉट मिलेगा?"*), English.
- **Definition of Done**: Voice agent detects spoken language and responds in the matching native tongue.

---

### PHASE 7 — Real Inbound PSTN Telephony (Twilio + LiveKit SIP)
- **Files to Modify/Create**:
  - `src/app/api/twilio/voice/route.ts` [MODIFY] — Inbound SIP trunk dispatch / TwiML router.
  - `src/lib/twilio/validator.ts` [NEW] — Cryptographic `X-Twilio-Signature` validator.
  - `backend/agent/voice_worker.py` [MODIFY] — Production LiveKit entrypoint.
- **Database Migrations**: None.
- **APIs**:
  - `POST /api/twilio/voice`, `POST /api/twilio/gather`, `POST /api/twilio/status`.
- **Dependencies**: `twilio`, `livekit-agents`.
- **Tests**: Dial real Twilio phone number from mobile phone; voice agent answers and executes booking.
- **Definition of Done**: Real telephone calls connect to AI receptionist with sub-300ms voice pipeline.

---

### PHASE 8 — Emergency Medical Triage & Human Handoff
- **Files to Modify/Create**:
  - `src/lib/ai/prompts.ts` [MODIFY] — Emergency trigger keyword matrices.
  - `src/app/api/twilio/voice/route.ts` [MODIFY] — `<Dial>` forwarder on emergency or agent pause.
  - `src/app/clinic/settings/page.tsx` [MODIFY] — Primary & backup handoff number configurator.
- **Database Migrations**: None.
- **APIs**:
  - `POST /api/ai/tools` (tool `transfer_to_human`).
- **Tests**: Caller says *"Severe chest pain and heavy bleeding"* $\rightarrow$ AI halts booking and immediately forwards call to emergency number.
- **Definition of Done**: Guardrails prevent medical diagnosis and reliably transfer distressed callers.

---

### PHASE 9 — Security Hardening & Tenant Isolation
- **Files to Modify/Create**:
  - `supabase/migrations/20240830000002_rls_policies.sql` [MODIFY] — Full multi-tenant RLS audit.
  - `src/lib/security/sanitize.ts` [NEW] — Input sanitization & PII redaction.
- **Database Migrations**: Update RLS policies across all 14 tables.
- **Tests**: Run automated penetration test attempting cross-tenant reads and SQL injection payloads.
- **Definition of Done**: Zero cross-tenant leakage; service role keys protected from client-side bundle.

---

### PHASE 10 — 20-Scenario End-to-End Verification Suite
- **Files to Modify/Create**:
  - `scratch/verify-production-e2e.mjs` [NEW] — Automated 20-scenario test suite.
- **Tests**: Run all 20 production test cases covering unit, integration, RLS, and live call flows.
- **Definition of Done**: 20/20 test scenarios passing (100%).

---

### PHASE 11 — Production Deployment & Monitoring
- **Files to Modify/Create**:
  - `Dockerfile` [MODIFY] — Optimized Next.js production container.
  - `backend/Dockerfile` [MODIFY] — Optimized Python 3.11 LiveKit container.
  - `docker-compose.prod.yml` [NEW] — Production multi-container orchestration.
- **Tests**: Healthcheck endpoints (`/api/health`) returning 200 OK.
- **Definition of Done**: Application deployed to production with CI/CD and telemetry logging.

---

## Part 3: Architecture Status Checklist

| Area | Component | Status |
| :--- | :--- | :---: |
| **Foundation** | 14-Table PostgreSQL Schema & DDL | DONE ✅ |
| **Foundation** | Atomic Booking SQL RPC Function | DONE ✅ |
| **Foundation** | In-Memory Local Store (Fallback Engine) | DONE ✅ |
| **Foundation** | 8 Zod-Validated AI Receptionist Tools | DONE ✅ |
| **Foundation** | Core Slot Engine (Breaks, Leaves, Holidays) | DONE ✅ |
| **Simulation** | iPhone 16 Pro In-Call Web Simulator | DONE ✅ |
| **Simulation** | Hands-Free Continuous Voice Loop | DONE ✅ |
| **Simulation** | Microsoft Edge Neural TTS API | DONE ✅ |
| **Simulation** | Transcripts & Waveform Audio Player UI | DONE ✅ |
| **Persistence** | Direct Cloud Supabase Postgres Querying | IN PROGRESS 🟡 |
| **Persistence** | Supabase Storage Bucket for Recordings | NOT STARTED 🔴 |
| **Persistence** | Expiring Signed URLs for Audio Recordings | NOT STARTED 🔴 |
| **Telephony** | Twilio TwiML `<Say>` / `<Gather>` Webhook | DONE ✅ |
| **Telephony** | Twilio Webhook Cryptographic Signature Verification | NOT STARTED 🔴 |
| **Telephony** | LiveKit SIP Ingress Real-Time Voice Worker | IN PROGRESS 🟡 |
| **Access Control** | Super Admin vs Clinic User RBAC Middleware | NOT STARTED 🔴 |
| **Access Control** | Supabase Auth Login & Passwordless Magic Links | NOT STARTED 🔴 |
| **UI Routes** | Dedicated Platform Super Admin Suite (`/admin`) | NOT STARTED 🔴 |
| **UI Routes** | Dedicated Patient Records Page (`/clinic/patients`) | NOT STARTED 🔴 |
| **Verification** | 84 Automated Contract Test Cases | DONE ✅ |
| **Verification** | 20-Scenario Production E2E Verification Suite | NOT STARTED 🔴 |
