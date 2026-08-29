export function buildInboundGreetingTwiML(
  clinicName: string = 'Apollo Dental Clinic',
  gatherActionUrl: string = '/api/twilio/gather'
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Aditi" language="en-IN">
        Hello! Thank you for calling ${clinicName}. How can I assist you with your appointment or visit today?
    </Say>
    <Gather input="speech" action="${gatherActionUrl}" method="POST" speechTimeout="auto" language="en-IN">
        <Say voice="Polly.Aditi" language="en-IN">Please go ahead, I am listening.</Say>
    </Gather>
    <Say voice="Polly.Aditi" language="en-IN">We did not receive any response. Please call back anytime. Goodbye!</Say>
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
    <Say voice="Polly.Aditi" language="en-IN">${replyText}</Say>
    <Hangup/>
</Response>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Aditi" language="en-IN">${replyText}</Say>
    <Gather input="speech" action="${gatherActionUrl}" method="POST" speechTimeout="auto" language="en-IN"/>
</Response>`;
}

export function buildHumanTransferTwiML(
  handoffNumber: string = '+919876500001',
  statusCallbackUrl: string = '/api/twilio/status'
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Aditi" language="en-IN">Connecting you to clinic front-desk staff, please hold...</Say>
    <Dial timeout="20" action="${statusCallbackUrl}">
        <Number>${handoffNumber}</Number>
    </Dial>
</Response>`;
}
