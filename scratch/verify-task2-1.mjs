// Task 2.1 Verification Suite: Schema Tables 13 & 14 (Conversations & Messages)
// Tests: LocalStore conversations and messages, query & mutation methods, automatic turn mirroring, and chat route logging.

async function runVerification() {
  let baseUrl = 'http://localhost:3001';
  try {
    const check = await fetch('http://localhost:3001/api/clinic');
    if (!check.ok) baseUrl = 'http://localhost:3000';
  } catch {
    baseUrl = 'http://localhost:3000';
  }
  console.log(`🧪 Starting Task 2.1 Verification (Conversations & Messages Store) on ${baseUrl}...\n`);

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
    console.log('--- 1. Testing Seeded Conversations & Messages (Tables 13 & 14) ---');
    const convsRes = await fetch(`${baseUrl}/api/conversations`);
    const convsData = await convsRes.json();
    assert(convsData.success && convsData.count >= 3, `Seeded conversations exist (count: ${convsData.count})`);

    const conv1Res = await fetch(`${baseUrl}/api/conversations?call_id=call-1`);
    const conv1Data = await conv1Res.json();
    assert(conv1Data.success === true, 'Conversation for call-1 found');
    assert(Array.isArray(conv1Data.messages) && conv1Data.messages.length === 5, `Conversation call-1 has 5 messages (found: ${conv1Data.messages?.length})`);

    const msg1 = conv1Data.messages[0];
    assert(msg1.speaker === 'RECEPTIONIST', 'First message speaker is RECEPTIONIST');
    const msg2 = conv1Data.messages[1];
    assert(msg2.speaker === 'PATIENT', 'Second message speaker is PATIENT');
    const msg3 = conv1Data.messages[2];
    assert(msg3.tool_called === 'check_availability', 'Tool called correctly recorded in message');

    console.log('\n--- 2. Testing Direct Conversation Creation & Message Appending ---');
    const testCallId = `test-call-${Date.now()}`;
    const addMsgRes = await fetch(`${baseUrl}/api/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        call_id: testCallId,
        speaker: 'PATIENT',
        content: 'Is Dr. Ashish Verma in clinic today?',
        latency_ms: 120,
      }),
    });
    const addMsgData = await addMsgRes.json();
    assert(addMsgData.success === true, 'POST /api/conversations appends message and creates conversation');
    assert(addMsgData.message?.content === 'Is Dr. Ashish Verma in clinic today?', 'Message content returned matches');

    const fetchNewConvRes = await fetch(`${baseUrl}/api/conversations?call_id=${testCallId}`);
    const fetchNewConvData = await fetchNewConvRes.json();
    assert(fetchNewConvData.success && fetchNewConvData.messages.length === 1, 'New conversation query returns the appended message');

    console.log('\n--- 3. Testing Chat Route Integration with call_id ---');
    const chatCallId = `chat-test-${Date.now()}`;
    const chatRes = await fetch(`${baseUrl}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clinic_id: '00000000-0000-0000-0000-000000000001',
        message: 'What is the consultation fee?',
        call_id: chatCallId,
      }),
    });

    const chatData = await chatRes.json();
    assert(chatData.success === true, 'Chat API responded successfully');
    assert(chatData.call_id === chatCallId, 'Chat API returned active call_id');

    // Verify conversation was automatically recorded for this chat
    const chatConvRes = await fetch(`${baseUrl}/api/conversations?call_id=${chatCallId}`);
    const chatConvData = await chatConvRes.json();
    assert(chatConvData.success === true, 'Conversation was automatically created for live chat turn');
    assert(chatConvData.messages.length === 2, `Live chat recorded 2 turns (user + AI), found: ${chatConvData.messages.length}`);
    assert(chatConvData.messages[0].speaker === 'PATIENT', 'First turn recorded as PATIENT');
    assert(chatConvData.messages[1].speaker === 'RECEPTIONIST', 'Second turn recorded as RECEPTIONIST');

    console.log('\n========================================');
    console.log(`Verification Complete: ${passCount} Passed, ${failCount} Failed.`);
    console.log('========================================\n');

    if (failCount > 0) process.exit(1);
  } catch (err) {
    console.error('Fatal error during Task 2.1 verification:', err);
    process.exit(1);
  }
}

runVerification();
