export function buildInboundGreetingTwiML(
  clinicName: string = 'Apollo Dental Clinic',
  customGreeting?: string,
  gatherActionUrl: string = '/api/twilio/gather',
  statusCallbackUrl: string = '/api/twilio/status'
): string {
  const greetingText = customGreeting || `Hello! Thank you for calling ${clinicName}. My name is Maya, your AI receptionist. How can I help you today?`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Aditi" language="en-IN">${escapeXml(greetingText)}</Say>
    <Gather input="speech" action="${gatherActionUrl}" method="POST" speechTimeout="auto" language="en-IN" hints="appointment, doctor, fee, root canal, timing, parking, Dr Verma, Dr Kulkarni, Dr Mehta">
        <Say voice="Polly.Aditi" language="en-IN">Please go ahead, I am listening.</Say>
    </Gather>
    <Say voice="Polly.Aditi" language="en-IN">I could not hear your response. Please call us back anytime. Have a wonderful day!</Say>
    <Hangup/>
</Response>`;
}

export function buildSpeechResponseTwiML(
  replyText: string,
  gatherActionUrl: string = '/api/twilio/gather',
  isEndCall: boolean = false
): string {
  if (isEndCall) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Aditi" language="en-IN">${escapeXml(replyText)}</Say>
    <Hangup/>
</Response>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Aditi" language="en-IN">${escapeXml(replyText)}</Say>
    <Gather input="speech" action="${gatherActionUrl}" method="POST" speechTimeout="auto" language="en-IN" hints="appointment, book, fee, cancel, reschedule, Dr Verma, Dr Kulkarni, Dr Mehta"/>
    <Say voice="Polly.Aditi" language="en-IN">Thank you for calling our clinic. Have a wonderful day!</Say>
    <Hangup/>
</Response>`;
}

export function buildHumanTransferTwiML(
  handoffNumber: string = '+919876500001',
  statusCallbackUrl: string = '/api/twilio/status',
  transferMessage: string = 'Connecting you to clinic front-desk staff, please hold...'
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Aditi" language="en-IN">${escapeXml(transferMessage)}</Say>
    <Dial timeout="25" action="${statusCallbackUrl}" method="POST">
        <Number>${handoffNumber}</Number>
    </Dial>
</Response>`;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

