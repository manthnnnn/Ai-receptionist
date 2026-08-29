import { NextRequest, NextResponse } from 'next/server';
import { buildInboundGreetingTwiML } from '@/lib/twilio/twiml';
import { localStore } from '@/lib/store/local-store';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData().catch(() => new FormData());
    const fromNumber = (formData.get('From') as string) || '+91-UNKNOWN';
    const clinicId = '00000000-0000-0000-0000-000000000001';

    const clinic = localStore.getClinicById(clinicId);
    const twiml = buildInboundGreetingTwiML(clinic?.name || 'Apollo Dental Clinic');

    // Log call start
    localStore.logCall({
      clinic_id: clinicId,
      caller_phone: fromNumber,
      started_at: new Date().toISOString(),
      duration_seconds: 0,
      call_intent: 'Incoming PSTN Phone Call',
      outcome: 'FAQ_ANSWERED',
    });

    return new NextResponse(twiml, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  } catch (error: any) {
    return new NextResponse(
      `<Response><Say>An error occurred connecting to the receptionist. Please hold.</Say></Response>`,
      { headers: { 'Content-Type': 'application/xml' } }
    );
  }
}
