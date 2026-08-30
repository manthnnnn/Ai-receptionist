import { NextRequest, NextResponse } from 'next/server';
import { localStore } from '@/lib/store/local-store';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData().catch(() => new FormData());
    const callSid = (formData.get('CallSid') as string) || '';
    const callDuration = formData.get('CallDuration') as string;
    const callStatus = (formData.get('CallStatus') as string) || 'completed';
    const fromNumber = (formData.get('From') as string) || '+91-UNKNOWN';
    const toNumber = (formData.get('To') as string) || '';
    const durationSec = callDuration ? parseInt(callDuration, 10) : 0;
    const timestamp = formData.get('Timestamp') as string || new Date().toISOString();

    const clinic = toNumber ? localStore.getClinicByPhone(toNumber) : localStore.getClinics()[0];
    const clinicId = clinic?.id || '00000000-0000-0000-0000-000000000001';

    // Map Twilio CallStatus to outcome if needed
    let outcome: 'BOOKED' | 'ESCALATED' | 'FAQ_ANSWERED' | 'CANCELLED' | 'RESCHEDULED' = 'FAQ_ANSWERED';
    if (callStatus === 'no-answer' || callStatus === 'busy' || callStatus === 'failed') {
      outcome = 'ESCALATED';
    }

    // Check if call log exists and update, or create a new one
    const existing = callSid ? localStore.getCallLogBySid(callSid) : undefined;
    if (existing) {
      localStore.updateCallLog(callSid, {
        duration_seconds: durationSec || existing.duration_seconds,
        ended_at: timestamp,
        outcome: existing.outcome || outcome,
      });
    } else {
      localStore.logCall({
        id: callSid || `call-${Date.now()}`,
        clinic_id: clinicId,
        caller_phone: fromNumber,
        started_at: new Date(Date.now() - (durationSec * 1000)).toISOString(),
        ended_at: timestamp,
        duration_seconds: durationSec,
        call_intent: 'Inbound Twilio Call',
        outcome,
        transcript_preview: `Call completed with status: ${callStatus}, duration: ${durationSec}s`,
      });
    }

    return NextResponse.json({
      success: true,
      call_sid: callSid,
      call_status: callStatus,
      duration_seconds: durationSec,
      timestamp,
    });
  } catch (error: any) {
    console.error('Error in Twilio Status Webhook:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Twilio status callback endpoint active and operational',
  });
}

