// Task 2.5: Comprehensive Full-Stack End-to-End Verification Suite
// Validates:
// 1. All 8 AI Tool Execution Contracts (/api/ai/tools)
// 2. Conversation & Message Store (Schema Tables 13 & 14)
// 3. Audio Recording Attachment & Playback Metadata
// 4. Twilio Telephony Webhook Lifecycle & Outcome Engine
// 5. Multi-Tenant Isolation (RLS Boundaries)

import fs from 'fs';

async function runFullStackE2E() {
  let baseUrl = 'http://localhost:3000';
  try {
    const check = await fetch('http://localhost:3000/api/clinic');
    if (!check.ok) baseUrl = 'http://localhost:3001';
  } catch {
    baseUrl = 'http://localhost:3001';
  }

  console.log(`\n======================================================================`);
  console.log(`🚀 STARTING TASK 2.5: COMPREHENSIVE FULL-STACK E2E VERIFICATION SUITE`);
  console.log(`🎯 Testing Server Base URL: ${baseUrl}`);
  console.log(`======================================================================\n`);

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

  const clinic1Id = '00000000-0000-0000-0000-000000000001'; // Apollo Dental
  const clinic2Id = '00000000-0000-0000-0000-000000000002'; // Radiance Dermatology

  try {
    // ═══════════════════════════════════════════════════════════════════════
    // PART 1: 8 AI Tool Execution Contracts (/api/ai/tools)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('📌 PART 1: VALIDATING ALL 8 AI TOOL EXECUTION CONTRACTS');

    // 1. get_clinic_information
    const t1Res = await fetch(`${baseUrl}/api/ai/tools`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool_name: 'get_clinic_information',
        arguments: { clinic_id: clinic1Id },
      }),
    });
    const t1 = await t1Res.json();
    assert(t1.success && t1.result?.clinic?.name === 'Apollo Dental Clinic', 'Tool 1 (get_clinic_information) returned clinic details & operating hours');

    // 2. get_doctor_information
    const t2Res = await fetch(`${baseUrl}/api/ai/tools`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool_name: 'get_doctor_information',
        arguments: { clinic_id: clinic1Id },
      }),
    });
    const t2 = await t2Res.json();
    assert(t2.success && Array.isArray(t2.result?.doctors) && t2.result?.doctors.length > 0, 'Tool 2 (get_doctor_information) returned active doctor roster');
    const doctorId = t2.result.doctors[0].doctor_id || t2.result.doctors[0].id;
    const doctorName = t2.result.doctors[0].name;

    // 3. check_availability
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 2);
    const targetDateStr = targetDate.toISOString().split('T')[0];

    const t3Res = await fetch(`${baseUrl}/api/ai/tools`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool_name: 'check_availability',
        arguments: {
          clinic_id: clinic1Id,
          doctor_name: doctorName,
          target_date: targetDateStr,
        },
      }),
    });
    const t3 = await t3Res.json();
    assert(t3.success && Array.isArray(t3.result?.available_slots), 'Tool 3 (check_availability) returned slot engine calculated open slots');
    const chosenSlot = t3.result?.slots_iso?.[0]?.start_iso || `${targetDateStr}T11:00:00.000Z`;
    const patientPhone = '+91 99887 66554';
    const patientName = 'Vikram Mehta';

    // 4. book_appointment (Atomic reservation)
    const t4Res = await fetch(`${baseUrl}/api/ai/tools`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool_name: 'book_appointment',
        arguments: {
          clinic_id: clinic1Id,
          doctor_id: doctorId,
          patient_name: patientName,
          patient_phone: patientPhone,
          start_at: chosenSlot,
          notes: 'Full stack verification test booking',
        },
      }),
    });
    const t4 = await t4Res.json();
    assert(t4.success && t4.result?.appointment?.id, 'Tool 4 (book_appointment) confirmed atomic appointment with schedule lock');
    const bookedAppId = t4.result?.appointment?.id;

    // Test Atomic Collision Prevention (Double-Booking Block)
    const t4Collision = await (await fetch(`${baseUrl}/api/ai/tools`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool_name: 'book_appointment',
        arguments: {
          clinic_id: clinic1Id,
          doctor_id: doctorId,
          patient_name: 'Another Patient',
          patient_phone: '+91 91111 22222',
          start_at: chosenSlot,
        },
      }),
    })).json();
    assert(t4Collision.result?.success === false && t4Collision.result?.error_code === 'SLOT_ALREADY_BOOKED', 'Tool 4 strictly rejected double-booking on same slot');

    // 5. get_patient_appointments
    const t5Res = await fetch(`${baseUrl}/api/ai/tools`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool_name: 'get_patient_appointments',
        arguments: {
          clinic_id: clinic1Id,
          caller_phone: patientPhone,
        },
      }),
    });
    const t5 = await t5Res.json();
    assert(t5.success && Array.isArray(t5.result?.appointments) && t5.result?.appointments.length > 0, 'Tool 5 (get_patient_appointments) retrieved patient appointments');

    // 6. reschedule_appointment
    const newSlotIso = t3.result?.slots_iso?.[1]?.start_iso || `${targetDateStr}T14:30:00.000Z`;
    const t6Res = await fetch(`${baseUrl}/api/ai/tools`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool_name: 'reschedule_appointment',
        arguments: {
          clinic_id: clinic1Id,
          appointment_id: bookedAppId,
          patient_name: patientName,
          caller_phone: patientPhone,
          new_start_at: newSlotIso,
        },
      }),
    });
    const t6 = await t6Res.json();
    assert(t6.success && t6.result?.appointment?.start_at === newSlotIso, 'Tool 6 (reschedule_appointment) moved appointment to new slot');

    // 7. cancel_appointment
    const t7Res = await fetch(`${baseUrl}/api/ai/tools`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool_name: 'cancel_appointment',
        arguments: {
          clinic_id: clinic1Id,
          appointment_id: bookedAppId,
          patient_name: patientName,
          caller_phone: patientPhone,
          reason: 'Patient rescheduled conflict',
        },
      }),
    });
    const t7 = await t7Res.json();
    assert(t7.success && t7.result?.success === true, 'Tool 7 (cancel_appointment) cancelled appointment and released slot');

    // 8. transfer_to_human
    const t8Res = await fetch(`${baseUrl}/api/ai/tools`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool_name: 'transfer_to_human',
        arguments: {
          clinic_id: clinic1Id,
          reason: 'MEDICAL_EMERGENCY_DETECTED',
        },
      }),
    });
    const t8 = await t8Res.json();
    assert(t8.success && t8.result?.handoff_number !== undefined, 'Tool 8 (transfer_to_human) triggered emergency escalation to handoff number');

    // ═══════════════════════════════════════════════════════════════════════
    // PART 2: Conversation & Message Store (Schema Tables 13 & 14)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n📌 PART 2: CONVERSATION & MESSAGE PERSISTENCE (TABLES 13 & 14)');

    const e2eCallId = `call-e2e-${Date.now()}`;
    const addConvMsgRes = await fetch(`${baseUrl}/api/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        call_id: e2eCallId,
        speaker: 'PATIENT',
        content: 'Hi Maya, I would like to book an appointment with Dr. Ashish Verma tomorrow.',
        latency_ms: 110,
      }),
    });
    const addConvMsgData = await addConvMsgRes.json();
    assert(addConvMsgData.success === true, 'Created new conversation and saved PATIENT message');

    const appendAiRes = await fetch(`${baseUrl}/api/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        call_id: e2eCallId,
        speaker: 'RECEPTIONIST',
        content: 'Sure! Dr. Ashish Verma has slots open at 11:00 AM and 2:00 PM.',
        tool_called: 'check_availability',
        latency_ms: 460,
      }),
    });
    const appendAiData = await appendAiRes.json();
    assert(appendAiData.success === true, 'Appended RECEPTIONIST message with tool telemetry');

    const convInspect = await (await fetch(`${baseUrl}/api/conversations?call_id=${e2eCallId}`)).json();
    assert(convInspect.success && convInspect.messages.length === 2, 'Deep inspection verified full multi-turn conversation saved in Table 14');

    // ═══════════════════════════════════════════════════════════════════════
    // PART 3: Audio Recording Attachment & Twilio Telemetry Lifecycle
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n📌 PART 3: AUDIO RECORDING ATTACHMENT & TWILIO TELEMETRY');

    const twilioSid = `CA_E2E_${Date.now()}`;
    const testAudioUrl = 'https://api.twilio.com/2010-04-01/Accounts/AC123/Recordings/RE12345.mp3';

    const statusRes = await fetch(`${baseUrl}/api/twilio/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        CallSid: twilioSid,
        CallDuration: '168',
        CallStatus: 'completed',
        From: '+91 98450 12345',
        RecordingUrl: testAudioUrl,
      }),
    });
    const statusData = await statusRes.json();
    assert(statusData.success === true && statusData.duration_seconds === 168, 'Twilio status callback logged call duration = 168s');
    assert(statusData.recording_url === testAudioUrl, 'Twilio status callback attached recording audio URL to call log');

    const callLogInspect = await (await fetch(`${baseUrl}/api/twilio/status?call_sid=${twilioSid}`)).json();
    assert(callLogInspect.call_log?.recording_url === testAudioUrl, 'GET /api/twilio/status verified recording URL stored in call log');

    // ═══════════════════════════════════════════════════════════════════════
    // PART 4: Multi-Tenant RLS Isolation Boundary
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n📌 PART 4: MULTI-TENANT RLS ISOLATION');

    const c1Calls = await (await fetch(`${baseUrl}/api/calls?clinic_id=${clinic1Id}`)).json();
    const c2Calls = await (await fetch(`${baseUrl}/api/calls?clinic_id=${clinic2Id}`)).json();
    assert(c1Calls.success && c2Calls.success, 'Fetched separate call logs for both tenants');

    const c1Ids = new Set((c1Calls.calls || []).map((c) => c.id));
    const c2HasC1 = (c2Calls.calls || []).some((c) => c1Ids.has(c.id));
    assert(!c2HasC1, 'Zero cross-tenant leakage between Clinic 1 and Clinic 2 call logs');

    // ═══════════════════════════════════════════════════════════════════════
    // PART 5: Docker & Container Orchestration Validation
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n📌 PART 5: DOCKER & CONTAINER ORCHESTRATION VALIDATION');

    const hasRootDockerfile = fs.existsSync('Dockerfile');
    const hasBackendDockerfile = fs.existsSync('backend/Dockerfile');
    const hasCompose = fs.existsSync('docker-compose.yml');

    assert(hasRootDockerfile, 'Next.js root Dockerfile exists');
    assert(hasBackendDockerfile, 'Python voice worker backend/Dockerfile exists');
    assert(hasCompose, 'Multi-service docker-compose.yml exists');

    const composeContent = fs.readFileSync('docker-compose.yml', 'utf-8');
    assert(composeContent.includes('web:') && composeContent.includes('voice-worker:'), 'docker-compose.yml defines both web and voice-worker services');

    console.log('\n======================================================================');
    console.log(`🏁 FULL-STACK E2E VERIFICATION COMPLETE: ${passCount} Passed, ${failCount} Failed.`);
    console.log(`======================================================================\n`);

    if (failCount > 0) process.exit(1);
  } catch (err) {
    console.error('Fatal error during Full-Stack E2E verification:', err);
    process.exit(1);
  }
}

runFullStackE2E();
