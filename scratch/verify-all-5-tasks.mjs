// Comprehensive Automated Verification for 5 Completed Tasks:
// 1. Supabase Cloud Database & Atomic RPC Direct Binding
// 2. Real PSTN Telephony (Twilio HMAC-SHA1 Webhook Validation & Ingress)
// 3. Audio Recording Storage, Signed URLs & Recording Consent Policy
// 4. Multilingual Voice Intelligence & Dynamic Code-Switching
// 5. Role-Based Access Control (RBAC) & Route Architecture

import crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failCount++;
  }
}

// Load env
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return {};
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
    }
  }
  return env;
}

const env = loadEnv();
for (const [k, v] of Object.entries(env)) {
  if (!process.env[k]) process.env[k] = v;
}

async function runVerification() {
  console.log('======================================================================');
  console.log('🚀 RUNNING 5-TASK COMPLETION VERIFICATION SUITE');
  console.log('======================================================================\n');

  // ══════════════════════════════════════════════════════════════════
  // TASK 1: Database Persistence & Atomic RPCs
  // ══════════════════════════════════════════════════════════════════
  console.log('📌 [TASK 1] DATABASE PERSISTENCE & ATOMIC RPCS');
  const { db } = await import('../src/lib/db/index.ts');
  const clinicId = '00000000-0000-0000-0000-000000000001';
  const doctorId = '11111111-1111-1111-1111-111111111111';

  // 1.1 Query Clinics & Doctors
  const clinics = await db.getClinics();
  assert(clinics && clinics.length >= 2, `Retrieved ${clinics.length} clinics via database proxy`);

  const doctors = await db.getDoctors(clinicId);
  assert(doctors && doctors.length >= 3, `Retrieved ${doctors.length} active doctors via database proxy`);

  // 1.2 Test Atomic Booking RPC
  const testSlotStart = new Date(Date.now() + 86400000 * 35).toISOString();
  const testSlotEnd = new Date(new Date(testSlotStart).getTime() + 30 * 60000).toISOString();

  const bookResult = await db.bookAppointment({
    clinic_id: clinicId,
    doctor_id: doctorId,
    patient_name: 'Verification Patient',
    patient_phone: '+91 99999 88888',
    start_at: testSlotStart,
    end_at: testSlotEnd,
    booking_source: 'AI_VOICE',
    notes: 'Task 1 Automated Verification',
  });

  assert(
    bookResult.success && bookResult.appointment?.id,
    `Atomic booking executed successfully (App ID: ${bookResult.appointment?.id || 'OK'})`
  );

  const bookedAppId = bookResult.appointment?.id;

  // 1.3 Test Collision Protection (Advisory Lock / Slot collision)
  const collisionResult = await db.bookAppointment({
    clinic_id: clinicId,
    doctor_id: doctorId,
    patient_name: 'Colliding Patient',
    patient_phone: '+91 99999 77777',
    start_at: testSlotStart,
    end_at: testSlotEnd,
    booking_source: 'AI_VOICE',
  });

  assert(
    !collisionResult.success && (collisionResult.error_code === 'SLOT_ALREADY_BOOKED' || collisionResult.message?.includes('already booked')),
    `Concurrency guard: Duplicate booking rejected with conflict (${collisionResult.error_code || 'SLOT_COLLISION'})`
  );

  // 1.4 Test Atomic Reschedule
  if (bookedAppId) {
    const newStart = new Date(new Date(testSlotStart).getTime() + 3600000).toISOString();
    const newEnd = new Date(new Date(newStart).getTime() + 30 * 60000).toISOString();
    const reschedResult = await db.rescheduleAppointment(bookedAppId, newStart, newEnd);
    assert(reschedResult.success, 'Atomic reschedule executed successfully');

    // 1.5 Test Atomic Cancellation
    const cancelResult = await db.cancelAppointment(bookedAppId, 'Verification complete');
    assert(cancelResult.success, 'Atomic cancellation executed successfully');
  }

  // ══════════════════════════════════════════════════════════════════
  // TASK 2: Real PSTN Telephony (Twilio HMAC Signature & Ingress)
  // ══════════════════════════════════════════════════════════════════
  console.log('\n📌 [TASK 2] REAL PSTN TELEPHONY (TWILIO SIGNATURE & INGRESS)');
  const { validateTwilioSignature } = await import('../src/lib/twilio/validator.ts');
  const { buildMediaStreamTwiML, buildSipTwiML } = await import('../src/lib/twilio/twiml.ts');

  const testAuthToken = 'mock_twilio_auth_token_secret_12345';
  const testUrl = 'https://clinicai.com/api/twilio/voice?clinic_id=' + clinicId;
  const testParams = {
    CallSid: 'CA1234567890abcdef',
    From: '+919876543210',
    To: '+918045678901',
    CallStatus: 'in-progress',
  };

  // Compute expected HMAC signature
  const sortedKeys = Object.keys(testParams).sort();
  let signData = testUrl;
  for (const k of sortedKeys) signData += k + testParams[k];
  const validHmac = crypto.createHmac('sha1', testAuthToken).update(signData, 'utf-8').digest('base64');

  // Test with valid signature
  const isValidSig = validateTwilioSignature(testUrl, testParams, validHmac, testAuthToken);
  assert(isValidSig === true, 'Twilio cryptographic signature matches valid HMAC-SHA1');

  // Test with forged / tampered signature
  const isForgedSig = validateTwilioSignature(testUrl, testParams, 'invalid_forged_base64_signature=', testAuthToken);
  assert(isForgedSig === false, 'Tampered/Forged webhook signature rejected');

  // Test Media Stream TwiML generation
  const streamTwiml = buildMediaStreamTwiML('wss://clinicai.com/api/twilio/media-stream', { clinic_id: clinicId });
  assert(
    streamTwiml.includes('<Connect>') && streamTwiml.includes('<Stream url="wss://clinicai.com/api/twilio/media-stream">'),
    'Generated valid Twilio Media Streams WebSocket ingress TwiML'
  );

  // Test SIP Trunk TwiML generation
  const sipTwiml = buildSipTwiML('sip:receptionist@sip.livekit.cloud');
  assert(
    sipTwiml.includes('<Dial>') && sipTwiml.includes('<Sip>sip:receptionist@sip.livekit.cloud</Sip>'),
    'Generated valid LiveKit SIP Trunk binding TwiML'
  );

  // ══════════════════════════════════════════════════════════════════
  // TASK 3: Audio Recording Storage, Retention Policy & Signed URLs
  // ══════════════════════════════════════════════════════════════════
  console.log('\n📌 [TASK 3] AUDIO RECORDING STORAGE, RETENTION POLICY & SIGNED URLS');
  const { buildInboundGreetingTwiML } = await import('../src/lib/twilio/twiml.ts');
  const { uploadCallRecording } = await import('../src/lib/storage/recording-uploader.ts');

  // 3.1 Consent Policy TwiML Check
  const consentTwiml = buildInboundGreetingTwiML('Apollo Dental Clinic', 'Greeting', '/api/twilio/gather', '/api/twilio/status', 'CONSENT_REQUIRED');
  assert(
    consentTwiml.includes('Please note that this call may be recorded for quality and training purposes'),
    'Consent disclosure played when recording_policy = CONSENT_REQUIRED'
  );

  const disabledTwiml = buildInboundGreetingTwiML('Apollo Dental Clinic', 'Greeting', '/api/twilio/gather', '/api/twilio/status', 'DISABLED');
  assert(
    !disabledTwiml.includes('Please note that this call may be recorded'),
    'Consent disclosure and recording suppressed when recording_policy = DISABLED'
  );

  // 3.2 Recording Uploader Ingestion
  const mockCallSid = `test-call-${Date.now()}`;
  const uploadRes = await uploadCallRecording(clinicId, mockCallSid, 'https://api.twilio.com/mock-audio.mp3');
  assert(uploadRes.success, 'Recording uploader ingested call audio');

  // ══════════════════════════════════════════════════════════════════
  // TASK 4: Multilingual Voice Intelligence & Code-Switching
  // ══════════════════════════════════════════════════════════════════
  console.log('\n📌 [TASK 4] MULTILINGUAL VOICE INTELLIGENCE & CODE-SWITCHING');
  const { detectSpokenLanguage } = await import('../src/lib/ai/language-detector.ts');

  // 4.1 Devanagari Marathi
  const mrDev = detectSpokenLanguage('मला उद्या डॉक्टर वर्मांची भेट हवी आहे');
  assert(mrDev.language === 'mr' && mrDev.voice_id === 'mr-IN-AarohiNeural', `Devanagari Marathi detected -> ${mrDev.language} (${mrDev.voice_id})`);

  // 4.2 Romanized Marathi (Hinglish/Marathish)
  const mrRom = detectSpokenLanguage('mala udya doctor vermanchi bhet havi ahe shulka kiti ahe');
  assert(mrRom.language === 'mr', `Romanized Marathi detected -> ${mrRom.language}`);

  // 4.3 Devanagari Hindi
  const hiDev = detectSpokenLanguage('नमस्ते, क्या मुझे कल सुबह 11 बजे का स्लॉट मिल सकता है?');
  assert(hiDev.language === 'hi' && hiDev.voice_id === 'hi-IN-SwaraNeural', `Devanagari Hindi detected -> ${hiDev.language} (${hiDev.voice_id})`);

  // 4.4 Romanized Hindi
  const hiRom = detectSpokenLanguage('namaste mujhe kal subah doctor se milna hai');
  assert(hiRom.language === 'hi', `Romanized Hindi detected -> ${hiRom.language}`);

  // 4.5 English
  const enRes = detectSpokenLanguage('Hello, I would like to check doctor availability for tomorrow.');
  assert(enRes.language === 'en' && enRes.voice_id === 'en-IN-NeerjaNeural', `English detected -> ${enRes.language} (${enRes.voice_id})`);

  // 4.6 Mid-Call Code-Switching Test
  const switch1 = detectSpokenLanguage('Hello, can I book a root canal?', 'en');
  const switch2 = detectSpokenLanguage('मराठीत बोला, मला दातदुखीचा त्रास होतोय', switch1.language);
  assert(switch2.language === 'mr' && switch2.is_code_switch === true, 'Mid-call dynamic code-switching from English to Marathi detected');

  // ══════════════════════════════════════════════════════════════════
  // TASK 5: Role-Based Access Control (RBAC) & Route Architecture
  // ══════════════════════════════════════════════════════════════════
  console.log('\n📌 [TASK 5] ROLE-BASED ACCESS CONTROL (RBAC) & ROUTE ARCHITECTURE');
  const { getCurrentSession, hasRequiredRole } = await import('../src/lib/auth/session.ts');

  // Super Admin session check
  const superAdminSession = await getCurrentSession();
  assert(
    superAdminSession.role === 'SUPER_ADMIN' && hasRequiredRole(superAdminSession, ['CLINIC_ADMIN']) === true,
    'Super Admin role has universal bypass across all tenant routes'
  );

  // Non-super admin role restriction check
  const clinicAdminSession = {
    user_id: 'usr-1',
    email: 'doctor@clinic.com',
    full_name: 'Dr. Verma',
    role: 'CLINIC_ADMIN',
    clinic_id: clinicId,
    is_authenticated: true,
  };
  const isDeniedSuperAdmin = hasRequiredRole(clinicAdminSession, ['SUPER_ADMIN']);
  assert(isDeniedSuperAdmin === false, 'Clinic Admin is strictly blocked from SUPER_ADMIN platform routes');

  // Verify route files exist
  const filesToCheck = [
    'src/middleware.ts',
    'src/app/login/page.tsx',
    'src/app/admin/layout.tsx',
    'src/app/admin/page.tsx',
    'src/app/admin/clinics/page.tsx',
    'src/app/clinic/layout.tsx',
    'src/app/clinic/dashboard/page.tsx',
    'src/app/clinic/patients/page.tsx',
    'src/app/clinic/patients/[id]/page.tsx',
    'src/app/clinic/recordings/page.tsx',
    'src/app/api/calls/[id]/recording/route.ts',
    'src/app/api/twilio/media-stream/route.ts',
    'supabase/migrations/20240830000004_auth_triggers_and_superadmin.sql',
    'supabase/migrations/20240830000005_storage_policies.sql',
  ];

  for (const f of filesToCheck) {
    const fullPath = path.resolve(process.cwd(), f);
    assert(fs.existsSync(fullPath), `Required architecture file exists: ${f}`);
  }

  console.log('\n======================================================================');
  console.log(`VERIFICATION SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('======================================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runVerification().catch((e) => {
  console.error('Verification failed with exception:', e);
  process.exit(1);
});
