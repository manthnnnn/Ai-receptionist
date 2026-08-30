import { NextRequest, NextResponse } from 'next/server';
import { buildInboundGreetingTwiML } from '@/lib/twilio/twiml';
import { localStore } from '@/lib/store/local-store';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData().catch(() => new FormData());
    const fromNumber = (formData.get('From') as string) || '+91-UNKNOWN';
    const toNumber = (formData.get('To') as string) || '';
    const callSid = (formData.get('CallSid') as string) || `call-${Date.now()}`;
    const callStatus = (formData.get('CallStatus') as string) || 'in-progress';

    // Find clinic by dialed phone or fallback to primary clinic
    const clinic = toNumber ? localStore.getClinicByPhone(toNumber) : localStore.getClinics()[0];
    const clinicId = clinic?.id || '00000000-0000-0000-0000-000000000001';
    const settings = localStore.getClinicSettings(clinicId);

    // Build dynamic TwiML with clinic greeting
    const greeting = settings?.ai_greeting || `Hello! Thank you for calling ${clinic?.name || 'our clinic'}. How can I assist you with your appointment or visit today?`;
    const twiml = buildInboundGreetingTwiML(clinic?.name || 'Apollo Dental Clinic', greeting, `/api/twilio/gather?clinic_id=${clinicId}`);

    // Log call start with call_sid
    localStore.logCall({
      id: callSid,
      clinic_id: clinicId,
      caller_phone: fromNumber,
      started_at: new Date().toISOString(),
      duration_seconds: 0,
      call_intent: 'Incoming PSTN Phone Call',
      outcome: 'FAQ_ANSWERED',
      transcript_preview: `Call received from ${fromNumber}. Greeting played: "${greeting}"`,
    });

    return new NextResponse(twiml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
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
  // Allow healthcheck and GET inspections
  const clinic = localStore.getClinics()[0];
  const settings = localStore.getClinicSettings(clinic.id);
  const twiml = buildInboundGreetingTwiML(clinic.name, settings?.ai_greeting);

  return new NextResponse(twiml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}

