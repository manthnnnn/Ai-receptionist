import { NextRequest, NextResponse } from 'next/server';
import { buildInboundGreetingTwiML, buildMediaStreamTwiML, buildSipTwiML } from '@/lib/twilio/twiml';
import { validateTwilioRequest } from '@/lib/twilio/validator';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData().catch(() => new FormData());
    const formParams: Record<string, string> = {};
    formData.forEach((val, key) => {
      formParams[key] = String(val);
    });

    // ── Cryptographic Signature Verification ──
    const validation = await validateTwilioRequest(req, formParams);
    if (!validation.isValid) {
      console.error('Twilio Voice Webhook signature validation failed:', validation.reason);
      return new NextResponse('Unauthorized: Invalid Twilio Signature', { status: 403 });
    }

    const fromNumber = (formData.get('From') as string) || '+91-UNKNOWN';
    const toNumber = (formData.get('To') as string) || '';
    const callSid = (formData.get('CallSid') as string) || `call-${Date.now()}`;
    const callStatus = (formData.get('CallStatus') as string) || 'in-progress';

    // Check optional routing mode: query param ?mode=stream or ?mode=sip
    const { searchParams } = new URL(req.url);
    const routingMode = searchParams.get('mode') || '';

    // Find clinic by dialed phone or fallback to primary clinic
    const clinic = toNumber ? (await db.getClinicByPhone(toNumber)) : (await db.getClinics())[0];
    const clinicId = clinic?.id || '00000000-0000-0000-0000-000000000001';
    const settings = await db.getClinicSettings(clinicId);

    const isAgentEnabled = clinic?.agent_enabled ?? settings?.ai_enabled ?? true;
    const handoffNumber = clinic?.primary_handoff_number || settings?.primary_handoff_number || '+919876500001';
    const recordingPolicy = settings?.recording_policy || 'CONSENT_REQUIRED';

    // ── IF AGENT IS DISABLED: Instantly bypass AI & Dial Human Receptionist ──
    if (!isAgentEnabled) {
      const bypassTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="en-IN">Thank you for calling ${clinic?.name || 'our clinic'}. Please hold while we transfer your call directly to our front desk.</Say>
  <Dial callerId="${clinic?.phone_number || '+918045678901'}">${handoffNumber}</Dial>
</Response>`;

      await db.logCall({
        id: callSid,
        clinic_id: clinicId,
        caller_phone: fromNumber,
        started_at: new Date().toISOString(),
        duration_seconds: 0,
        call_intent: 'Bypassed to Human Receptionist (AI Agent Paused)',
        outcome: 'ESCALATED',
        transcript_preview: `AI agent paused by clinic admin. Call forwarded directly to ${handoffNumber}.`,
      });

      return new NextResponse(bypassTwiml, {
        headers: { 'Content-Type': 'application/xml; charset=utf-8' },
      });
    }

    // ── SIP Trunk Routing ──
    if (routingMode === 'sip') {
      const sipDomain = process.env.LIVEKIT_SIP_DOMAIN || 'sip.livekit.cloud';
      const sipUri = `sip:${clinicId}@${sipDomain}`;
      const sipTwiml = buildSipTwiML(sipUri, { clinicId, callerPhone: fromNumber });

      await db.logCall({
        id: callSid,
        clinic_id: clinicId,
        caller_phone: fromNumber,
        started_at: new Date().toISOString(),
        duration_seconds: 0,
        call_intent: 'SIP Trunk Telephony',
        outcome: 'FAQ_ANSWERED',
        transcript_preview: `Call bridged to SIP trunk: ${sipUri}`,
      });

      return new NextResponse(sipTwiml, {
        headers: { 'Content-Type': 'application/xml; charset=utf-8' },
      });
    }

    // ── Media Streams WebSocket Ingress ──
    if (routingMode === 'stream') {
      const host = req.headers.get('host') || 'localhost:3000';
      const wsProtocol = req.url.startsWith('https') ? 'wss' : 'ws';
      const streamUrl = `${wsProtocol}://${host}/api/twilio/media-stream`;
      const streamTwiml = buildMediaStreamTwiML(streamUrl, { clinic_id: clinicId, call_sid: callSid });

      await db.logCall({
        id: callSid,
        clinic_id: clinicId,
        caller_phone: fromNumber,
        started_at: new Date().toISOString(),
        duration_seconds: 0,
        call_intent: 'Media Streams Real-Time Audio',
        outcome: 'FAQ_ANSWERED',
        transcript_preview: `Call connected to Media Stream: ${streamUrl}`,
      });

      return new NextResponse(streamTwiml, {
        headers: { 'Content-Type': 'application/xml; charset=utf-8' },
      });
    }

    // ── Standard TwiML Voice Flow with Dynamic Recording Policy ──
    const greeting = settings?.ai_greeting || `Hello! Thank you for calling ${clinic?.name || 'our clinic'}. How can I assist you with your appointment or visit today?`;
    const twiml = buildInboundGreetingTwiML(
      clinic?.name || 'Apollo Dental Clinic',
      greeting,
      `/api/twilio/gather?clinic_id=${clinicId}`,
      '/api/twilio/status',
      recordingPolicy
    );

    // Log call start
    await db.logCall({
      id: callSid,
      clinic_id: clinicId,
      caller_phone: fromNumber,
      started_at: new Date().toISOString(),
      duration_seconds: 0,
      call_intent: 'Incoming PSTN Phone Call',
      outcome: 'FAQ_ANSWERED',
      transcript_preview: `Call received from ${fromNumber}. Recording Policy: [${recordingPolicy}]. Greeting played: "${greeting}"`,
    });

    return new NextResponse(twiml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'X-Recording-Policy': recordingPolicy,
      },
    });
  } catch (error: any) {
    console.error('Error in Twilio Voice Webhook:', error);
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Aditi" language="en-IN">An error occurred connecting to the clinic receptionist. Please hold while we transfer you.</Say><Dial>+919876500001</Dial></Response>`,
      { headers: { 'Content-Type': 'application/xml; charset=utf-8' } }
    );
  }
}

export async function GET(req: NextRequest) {
  const clinic = (await db.getClinics())[0];
  const settings = await db.getClinicSettings(clinic.id);
  const twiml = buildInboundGreetingTwiML(
    clinic.name,
    settings?.ai_greeting,
    '/api/twilio/gather',
    '/api/twilio/status',
    settings?.recording_policy || 'CONSENT_REQUIRED'
  );

  return new NextResponse(twiml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
