// Task 2.2 & 2.3 Comprehensive Verification Suite
// Tests: Conversations & Transcripts API (Task 2.2) and Twilio Status Callback Lifecycle (Task 2.3)

async function runVerification() {
  let baseUrl = 'http://localhost:3000';
  try {
    const check = await fetch('http://localhost:3000/api/clinic');
    if (!check.ok) baseUrl = 'http://localhost:3001';
  } catch {
    baseUrl = 'http://localhost:3001';
  }
  console.log(`🧪 Starting Task 2.2 & 2.3 Verification on ${baseUrl}...\n`);

  let passCount = 0;
  let failCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passCount++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failCount++;
    }
  }

  try {
    // ═══════════════════════════════════════════════════════════════════
    // Task 2.2: Conversations & Transcripts API Verification
    // ═══════════════════════════════════════════════════════════════════
    console.log('--- 1. Task 2.2: Testing Conversations & Transcripts Query API ---');
    const conv1Res = await fetch(`${baseUrl}/api/conversations?call_id=call-1`);
    const conv1Data = await conv1Res.json();
    assert(conv1Data.success === true, 'GET /api/conversations?call_id=call-1 succeeds');
    assert(conv1Data.conversation?.call_id === 'call-1', 'Conversation linked to call-1');
    assert(Array.isArray(conv1Data.messages) && conv1Data.messages.length >= 5, `Deep message inspection returns all turns (count: ${conv1Data.messages?.length})`);
    assert(conv1Data.messages[0].speaker === 'RECEPTIONIST', 'Speaker role is RECEPTIONIST');
    assert(conv1Data.messages[1].speaker === 'PATIENT', 'Speaker role is PATIENT');
    assert(conv1Data.messages[2].tool_called === 'check_availability', 'Tool-calling telemetry preserved');

    // Test clinic-filtered conversations
    const clinicConvsRes = await fetch(`${baseUrl}/api/conversations?clinic_id=00000000-0000-0000-0000-000000000001`);
    const clinicConvsData = await clinicConvsRes.json();
    assert(clinicConvsData.success === true && clinicConvsData.count >= 3, `Clinic-filtered conversations returned (count: ${clinicConvsData.count})`);

    // ═══════════════════════════════════════════════════════════════════
    // Task 2.3: Twilio Status Callback Lifecycle & Duration Verification
    // ═══════════════════════════════════════════════════════════════════
    console.log('\n--- 2. Task 2.3: Testing Twilio Status Callback (Completed Call) ---');
    const testSid = `CA${Date.now()}xyz`;
    
    // First, simulate an in-progress call initiation
    const initRes = await fetch(`${baseUrl}/api/twilio/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        CallSid: testSid,
        CallDuration: '0',
        CallStatus: 'in-progress',
        From: '+91 98450 77777',
      }),
    });
    const initData = await initRes.json();
    assert(initData.success === true, 'Call status callback created initial call record');

    // Second, simulate Twilio terminal completion with duration update
    const completeRes = await fetch(`${baseUrl}/api/twilio/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        CallSid: testSid,
        CallDuration: '142',
        CallStatus: 'completed',
        Timestamp: new Date().toISOString(),
      }),
    });
    const completeData = await completeRes.json();
    assert(completeData.success === true, 'Terminal status callback updated successfully');
    assert(completeData.duration_seconds === 142, 'Duration recorded as 142 seconds');

    // Verify via GET inspection
    const inspectRes = await fetch(`${baseUrl}/api/twilio/status?call_sid=${testSid}`);
    const inspectData = await inspectRes.json();
    assert(inspectData.success === true && inspectData.call_log?.duration_seconds === 142, 'Inspect verified duration_seconds = 142');
    assert(inspectData.call_log?.ended_at !== undefined, 'Inspect verified ended_at timestamp recorded');

    console.log('\n--- 3. Task 2.3: Testing Terminal Outcomes (Busy, Failed, Canceled) ---');
    // Test Busy -> ESCALATED
    const busySid = `CA_BUSY_${Date.now()}`;
    await fetch(`${baseUrl}/api/twilio/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        CallSid: busySid,
        CallDuration: '8',
        CallStatus: 'busy',
        From: '+91 98220 99999',
      }),
    });
    const busyLog = await (await fetch(`${baseUrl}/api/twilio/status?call_sid=${busySid}`)).json();
    assert(busyLog.call_log?.outcome === 'ESCALATED', 'Busy call status mapped to ESCALATED outcome');
    assert(busyLog.call_log?.transfer_status === 'ESCALATED_TO_HUMAN', 'Busy call recorded transfer_status = ESCALATED_TO_HUMAN');

    // Test No-Answer / Canceled -> ABANDONED
    const cancelSid = `CA_CANCEL_${Date.now()}`;
    await fetch(`${baseUrl}/api/twilio/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        CallSid: cancelSid,
        CallDuration: '0',
        CallStatus: 'no-answer',
        From: '+91 98330 11111',
      }),
    });
    const cancelLog = await (await fetch(`${baseUrl}/api/twilio/status?call_sid=${cancelSid}`)).json();
    assert(cancelLog.call_log?.outcome === 'ABANDONED', 'No-answer call status mapped to ABANDONED outcome');

    console.log('\n--- 4. Task 2.3: Testing FormData Payload Format ---');
    const formParams = new URLSearchParams();
    const formSid = `CA_FORM_${Date.now()}`;
    formParams.append('CallSid', formSid);
    formParams.append('CallDuration', '95');
    formParams.append('CallStatus', 'completed');
    formParams.append('From', '+91 97777 55555');

    const formRes = await fetch(`${baseUrl}/api/twilio/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formParams.toString(),
    });
    const formDataRes = await formRes.json();
    assert(formDataRes.success === true && formDataRes.duration_seconds === 95, 'URL-encoded FormData processed successfully');

    console.log('\n========================================');
    console.log(`Verification Complete: ${passCount} Passed, ${failCount} Failed.`);
    console.log('========================================\n');

    if (failCount > 0) process.exit(1);
  } catch (err) {
    console.error('Fatal error during Task 2.2 & 2.3 verification:', err);
    process.exit(1);
  }
}

runVerification();
