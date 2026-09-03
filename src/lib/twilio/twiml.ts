export function buildInboundGreetingTwiML(
  clinicName: string = 'Apollo Dental Clinic',
  customGreeting?: string,
  gatherActionUrl: string = '/api/twilio/gather',
  statusCallbackUrl: string = '/api/twilio/status',
  recordingPolicy: 'ALWAYS' | 'CONSENT_REQUIRED' | 'DISABLED' = 'CONSENT_REQUIRED'
): string {
  const greetingText = customGreeting || `Hello! Thank you for calling ${clinicName}. My name is Maya, your AI receptionist. How can I help you today?`;

  // Consent disclosure for recording policy
  const consentDisclosure = recordingPolicy === 'CONSENT_REQUIRED'
    ? `<Say voice="Polly.Aditi" language="en-IN">Please note that this call may be recorded for quality and training purposes.</Say>`
    : '';

  // Recording instruction if ALWAYS enabled
  const recordingHeader = recordingPolicy === 'ALWAYS' || recordingPolicy === 'CONSENT_REQUIRED'
    ? `<Record action="${statusCallbackUrl}" recordingStatusCallback="${statusCallbackUrl}" maxLength="600" playBeep="false" />`
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    ${consentDisclosure}
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

/**
 * Generates Media Streams WebSocket ingress TwiML for autonomous real-time voice bridge
 */
export function buildMediaStreamTwiML(
  streamUrl: string,
  customParams?: Record<string, string>
): string {
  let paramsXml = '';
  if (customParams) {
    paramsXml = Object.entries(customParams)
      .map(([name, value]) => `        <Parameter name="${escapeXml(name)}" value="${escapeXml(value)}" />`)
      .join('\n');
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Connect>
        <Stream url="${escapeXml(streamUrl)}">
${paramsXml}
        </Stream>
    </Connect>
</Response>`;
}

/**
 * Generates SIP Trunk binding TwiML for autonomous 24/7 backend LiveKit SIP handling
 */
export function buildSipTwiML(
  sipUri: string,
  headers?: Record<string, string>
): string {
  let headersParam = '';
  if (headers) {
    const headerStr = Object.entries(headers)
      .map(([k, v]) => `X-${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join(';');
    headersParam = `?${headerStr}`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Dial>
        <Sip>${escapeXml(sipUri)}${headersParam}</Sip>
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
