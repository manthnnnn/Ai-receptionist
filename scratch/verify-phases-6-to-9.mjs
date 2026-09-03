// Automated Verification Suite for Phases 6, 7, 8, and 9
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
    if (idx !== -1) env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return env;
}

const env = loadEnv();
for (const [k, v] of Object.entries(env)) {
  if (!process.env[k]) process.env[k] = v;
}

async function runPhases6to9Verification() {
  console.log('======================================================================');
  console.log('🚀 RUNNING PHASES 6, 7, 8, & 9 VERIFICATION SUITE');
  console.log('======================================================================\n');

  // ══════════════════════════════════════════════════════════════════
  // PART 1: Phase 6 — Multilingual Voice Intelligence (MR / HI / EN)
  // ══════════════════════════════════════════════════════════════════
  console.log('📌 [PHASE 6] MULTILINGUAL VOICE INTELLIGENCE');
  const { detectSpokenLanguage, detectLanguageShift } = await import('../src/lib/ai/language-detector.ts');

  // 1.1 Language classification
  const mrDet = detectSpokenLanguage('मला उद्या दात स्वच्छ करायला यायचे आहे');
  assert(mrDet.language === 'mr' && mrDet.voice_id.includes('Aarohi'), 'Marathi detected -> mr (mr-IN-AarohiNeural)');

  const hiDet = detectSpokenLanguage('कल सुबह क्या डॉक्टर वर्मा की क्लिनिक खुली है?');
  assert(hiDet.language === 'hi' && hiDet.voice_id.includes('Swara'), 'Hindi detected -> hi (hi-IN-SwaraNeural)');

  const enDet = detectSpokenLanguage('Can I schedule a consultation for teeth whitening tomorrow?');
  assert(enDet.language === 'en' && enDet.voice_id.includes('Neerja'), 'English detected -> en (en-IN-NeerjaNeural)');

  // 1.2 Code-switching detection
  const shift = detectLanguageShift('मला दातांचे क्लिप्स बसवायचे आहेत', 'en');
  assert(shift.shifted === true && shift.targetLanguage === 'mr', 'Mid-call dynamic code-switching correctly detected (en -> mr)');

  // 1.3 Phonetic medical glossary in prompt
  const { buildSystemPrompt } = await import('../src/lib/ai/prompts.ts');
  const prompt = buildSystemPrompt('Apollo Dental', 'MG Road, Pune', '+91-80-4567-8901', [], [], '');
  assert(prompt.includes('रूट कॅनल ट्रीटमेंट'), 'Phonetic medical glossary embedded in system prompt (Root Canal)');
  assert(prompt.includes('दातांचे क्लिप्स'), 'Phonetic medical glossary embedded in system prompt (Orthodontics)');

  // ══════════════════════════════════════════════════════════════════
  // PART 2: Phase 7 — Real Inbound PSTN Telephony (Twilio + LiveKit SIP)
  // ══════════════════════════════════════════════════════════════════
  console.log('\n📌 [PHASE 7] REAL INBOUND PSTN TELEPHONY & SIP INGRESS');
  const { validateTwilioSignature } = await import('../src/lib/twilio/validator.ts');
  const { buildMediaStreamTwiML, buildSipTwiML } = await import('../src/lib/twilio/twiml.ts');
  const crypto = await import('crypto');

  // 2.1 Cryptographic signature validation
  const testUrl = 'https://clinic.ai/api/twilio/voice';
  const testParams = { CallSid: 'CA1234567890', From: '+919876543210', To: '+918045678901' };
  const mockToken = '1234567890abcdef1234567890abcdef';
  
  // Compute expected signature
  const sortedKeys = Object.keys(testParams).sort();
  let data = testUrl;
  for (const key of sortedKeys) {
    data += key + testParams[key];
  }
  const hmac = crypto.createHmac('sha1', mockToken);
  hmac.update(data, 'utf-8');
  const validSig = hmac.digest('base64');

  assert(validateTwilioSignature(testUrl, testParams, validSig, mockToken) === true, 'Twilio cryptographic signature validation matches HMAC-SHA1');
  assert(validateTwilioSignature(testUrl, testParams, 'invalid-sig', mockToken) === false, 'Tampered/Forged webhook signature rejected');

  // 2.2 LiveKit SIP Trunk & Media Streams TwiML
  const sipTwiml = buildSipTwiML('sip:apollo@sip.livekit.cloud');
  assert(sipTwiml.includes('<Dial>\n        <Sip>sip:apollo@sip.livekit.cloud</Sip>\n    </Dial>'), 'Generated valid LiveKit SIP Trunk TwiML');

  const streamTwiml = buildMediaStreamTwiML('wss://clinic.ai/api/twilio/media-stream');
  assert(streamTwiml.includes('<Stream url="wss://clinic.ai/api/twilio/media-stream"'), 'Generated valid Twilio Media Streams WebSocket ingress TwiML');

  // 2.3 LiveKit Python Agent Worker check
  const workerPath = path.resolve(process.cwd(), 'backend/agent/voice_worker.py');
  assert(fs.existsSync(workerPath), 'LiveKit real-time Python voice agent worker exists: backend/agent/voice_worker.py');

  // ══════════════════════════════════════════════════════════════════
  // PART 3: Phase 8 — Emergency Medical Triage & Human Handoff
  // ══════════════════════════════════════════════════════════════════
  console.log('\n📌 [PHASE 8] EMERGENCY MEDICAL TRIAGE & HUMAN HANDOFF');
  const { processReceptionistTurn } = await import('../src/lib/ai/orchestrator.ts');
  const { buildHumanTransferTwiML } = await import('../src/lib/twilio/twiml.ts');

  const clinicId = '00000000-0000-0000-0000-000000000001';

  // 3.1 English emergency trigger
  const enEmerg = await processReceptionistTurn(clinicId, 'I have severe chest pain and heavy bleeding', []);
  assert(enEmerg.call_outcome === 'ESCALATED', 'English emergency input flagged as ESCALATED');
  assert(enEmerg.tool_called === 'transfer_to_human', 'Emergency triage triggers tool transfer_to_human');
  assert(enEmerg.reply.toLowerCase().includes('emergency'), 'Emergency advice instructed in conversational response');

  // 3.2 Marathi emergency trigger
  const mrEmerg = await processReceptionistTurn(clinicId, 'माझ्या छातीत तीव्र वेदना होत आहेत आणि श्वास घेण्यास त्रास होतोय', []);
  assert(mrEmerg.call_outcome === 'ESCALATED', 'Marathi emergency input flagged as ESCALATED');
  assert(mrEmerg.language === 'mr', 'Emergency triage handled natively in Marathi');

  // 3.3 Hindi emergency trigger
  const hiEmerg = await processReceptionistTurn(clinicId, 'सीने में बहुत तेज दर्द है और खून बह रहा है', []);
  assert(hiEmerg.call_outcome === 'ESCALATED', 'Hindi emergency input flagged as ESCALATED');
  assert(hiEmerg.language === 'hi', 'Emergency triage handled natively in Hindi');

  // 3.4 Twilio <Dial> forwarding TwiML
  const handoffTwiml = buildHumanTransferTwiML('+919876500001', '/api/twilio/status', 'Connecting you now');
  assert(handoffTwiml.includes('<Number>+919876500001</Number>'), 'Generated Twilio <Dial> TwiML forwarder for emergency handoff');

  // ══════════════════════════════════════════════════════════════════
  // PART 4: Phase 9 — Security Hardening & Tenant Isolation
  // ══════════════════════════════════════════════════════════════════
  console.log('\n📌 [PHASE 9] SECURITY HARDENING & TENANT ISOLATION');
  const {
    normalizePhoneNumber,
    maskPhoneNumber,
    maskEmail,
    redactPII,
    sanitizeInput,
    hasSqlInjectionPayload,
  } = await import('../src/lib/security/sanitize.ts');

  // 4.1 Phone number E.164 normalization
  assert(normalizePhoneNumber('9876543210') === '+919876543210', 'E.164 normalization: 10-digit number -> +919876543210');
  assert(normalizePhoneNumber('09876543210') === '+919876543210', 'E.164 normalization: 0-prefixed STD number -> +919876543210');
  assert(normalizePhoneNumber('+91 98765-43210') === '+919876543210', 'E.164 normalization: spaced and hyphenated -> +919876543210');

  // 4.2 PII Redaction
  assert(maskPhoneNumber('+919876543210') === '+9198*** **210', 'PII phone masking: +919876543210 -> +9198*** **210');
  assert(maskEmail('ashish.verma@apollodental.com') === 'a***a@apollodental.com', 'PII email masking: ashish.verma@... -> a***a@...');
  
  const textWithPII = 'Call patient at +919876543210 or email contact@apolloclinic.com';
  const redacted = redactPII(textWithPII);
  assert(!redacted.includes('9876543210') && redacted.includes('***'), 'redactPII removes sensitive phone numbers from log output');

  // 4.3 Input sanitization
  const maliciousInput = '<script>alert("xss")</script><b>Appointment for John</b>';
  assert(sanitizeInput(maliciousInput) === 'Appointment for John', 'XSS script tags and HTML elements stripped cleanly');

  // 4.4 SQL Injection detection
  assert(hasSqlInjectionPayload("1' UNION SELECT * FROM profiles--") === true, 'SQL injection detector flagged UNION SELECT');
  assert(hasSqlInjectionPayload("admin' OR '1'='1") === true, "SQL injection detector flagged OR '1'='1 payload");
  assert(hasSqlInjectionPayload("appointment for tomorrow at 10am") === false, 'Safe natural language passes SQL detector');

  // 4.5 Multi-tenant RLS isolation
  const { db } = await import('../src/lib/db/client.ts');
  const c1Patients = await db.getPatients('00000000-0000-0000-0000-000000000001');
  const c2Patients = await db.getPatients('00000000-0000-0000-0000-000000000002');
  assert(c1Patients.every((p) => p.clinic_id === '00000000-0000-0000-0000-000000000001'), 'Tenant isolation: Clinic 1 patients belong strictly to Clinic 1');
  assert(c2Patients.every((p) => p.clinic_id === '00000000-0000-0000-0000-000000000002'), 'Tenant isolation: Clinic 2 patients belong strictly to Clinic 2');

  console.log('\n======================================================================');
  console.log(`VERIFICATION SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('======================================================================\n');

  if (failCount > 0) process.exit(1);
}

runPhases6to9Verification().catch((err) => {
  console.error('Verification failed with exception:', err);
  process.exit(1);
});
