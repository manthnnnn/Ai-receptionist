// Person 2 Verification Test Suite
async function runTests() {
  const baseUrl = 'http://localhost:3000';
  console.log('🚀 Starting Verification Tests for Person 2 (Platform & Webhooks Lead)...\n');

  let passed = 0;
  let total = 0;

  function assert(condition, testName, details = '') {
    total++;
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} - ${details}`);
    }
  }

  // 1. Inbound Webhook Endpoint: POST /api/twilio/voice
  try {
    const formData = new FormData();
    formData.append('From', '+919845099999');
    formData.append('To', '+91-80-4567-8901');
    formData.append('CallSid', 'CA_test_voice_call_001');
    formData.append('CallStatus', 'in-progress');

    const res = await fetch(`${baseUrl}/api/twilio/voice`, {
      method: 'POST',
      body: formData,
    });
    const xml = await res.text();
    
    assert(res.status === 200, 'POST /api/twilio/voice status 200');
    assert(res.headers.get('content-type')?.includes('xml'), 'POST /api/twilio/voice returns XML content-type');
    assert(xml.includes('<Response>') && xml.includes('Polly.Aditi'), 'POST /api/twilio/voice generates valid TwiML with Polly.Aditi voice');
    assert(xml.includes('Apollo Dental Clinic') || xml.includes('Hello!'), 'POST /api/twilio/voice contains dynamic clinic greeting');
    assert(xml.includes('/api/twilio/gather'), 'POST /api/twilio/voice includes speech gather action URL');
  } catch (err) {
    assert(false, 'POST /api/twilio/voice endpoint reachable', err.message);
  }

  // 2. Speech Turn & Fallback Transfer: POST /api/twilio/gather
  try {
    // Normal query turn
    const gatherData = new FormData();
    gatherData.append('SpeechResult', 'What are your consultation fees?');
    gatherData.append('From', '+919845099999');
    gatherData.append('CallSid', 'CA_test_voice_call_001');

    const resGather = await fetch(`${baseUrl}/api/twilio/gather?clinic_id=00000000-0000-0000-0000-000000000001`, {
      method: 'POST',
      body: gatherData,
    });
    const xmlGather = await resGather.text();
    assert(resGather.status === 200, 'POST /api/twilio/gather normal speech status 200');
    assert(xmlGather.includes('<Response>') && xmlGather.includes('<Say'), 'POST /api/twilio/gather returns TwiML speech response');

    // Escalation / Emergency query turn
    const transferData = new FormData();
    transferData.append('SpeechResult', 'This is an emergency, transfer me to doctor immediately');
    transferData.append('From', '+919845099999');
    transferData.append('CallSid', 'CA_test_voice_call_001');

    const resTransfer = await fetch(`${baseUrl}/api/twilio/gather?clinic_id=00000000-0000-0000-0000-000000000001`, {
      method: 'POST',
      body: transferData,
    });
    const xmlTransfer = await resTransfer.text();
    assert(resTransfer.status === 200, 'POST /api/twilio/gather escalation status 200');
    assert(xmlTransfer.includes('<Dial') && xmlTransfer.includes('<Number>'), 'POST /api/twilio/gather triggers PSTN fallback Dial on emergency');
  } catch (err) {
    assert(false, 'POST /api/twilio/gather endpoint reachable', err.message);
  }

  // 3. Call Status Callback Handler: POST /api/twilio/status
  try {
    const statusData = new FormData();
    statusData.append('CallSid', 'CA_test_voice_call_001');
    statusData.append('CallDuration', '118');
    statusData.append('CallStatus', 'completed');
    statusData.append('From', '+919845099999');
    statusData.append('To', '+91-80-4567-8901');

    const resStatus = await fetch(`${baseUrl}/api/twilio/status`, {
      method: 'POST',
      body: statusData,
    });
    const jsonStatus = await resStatus.json();
    assert(resStatus.status === 200 && jsonStatus.success, 'POST /api/twilio/status processes callback');
    assert(jsonStatus.duration_seconds === 118, 'POST /api/twilio/status captures duration correctly (118s)');
    assert(jsonStatus.call_status === 'completed', 'POST /api/twilio/status captures call status (completed)');
  } catch (err) {
    assert(false, 'POST /api/twilio/status endpoint reachable', err.message);
  }

  // 4. Verify Call was logged and updated in Call Logs: GET /api/calls
  try {
    const resCalls = await fetch(`${baseUrl}/api/calls?clinic_id=00000000-0000-0000-0000-000000000001`);
    const jsonCalls = await resCalls.json();
    assert(resCalls.status === 200 && jsonCalls.success, 'GET /api/calls returns call logs');
    const loggedCall = jsonCalls.calls.find(c => c.id === 'CA_test_voice_call_001' || c.caller_phone === '+919845099999');
    assert(!!loggedCall, 'Logged call found in database/store');
    assert(loggedCall?.duration_seconds === 118, 'Logged call has verified duration 118s');
  } catch (err) {
    assert(false, 'GET /api/calls verification', err.message);
  }

  // 5. Clinic Phone Management API: PATCH & GET /api/clinic
  try {
    const patchRes = await fetch(`${baseUrl}/api/clinic`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clinic_id: '00000000-0000-0000-0000-000000000001',
        phone_number: '+91-80-9988-7766',
        primary_handoff_number: '+91-98765-44332',
        ai_greeting: 'Welcome to Apollo Dental Koramangala! How can we help you?',
      }),
    });
    const patchJson = await patchRes.json();
    assert(patchRes.status === 200 && patchJson.success, 'PATCH /api/clinic updates phone & forwarding settings');

    const getRes = await fetch(`${baseUrl}/api/clinic?clinic_id=00000000-0000-0000-0000-000000000001`);
    const getJson = await getRes.json();
    assert(getJson.clinic?.phone_number === '+91-80-9988-7766', 'Virtual DID phone number updated in clinic store');
    assert(getJson.settings?.primary_handoff_number === '+91-98765-44332', 'Primary handoff number updated in clinic store');
    assert(getJson.settings?.ai_greeting.includes('Apollo Dental Koramangala'), 'AI custom greeting updated in clinic store');
  } catch (err) {
    assert(false, 'Clinic Phone Management API verification', err.message);
  }

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed}/${total} Passed (${Math.round((passed/total)*100)}%)`);
  console.log(`========================================\n`);
}

runTests();
