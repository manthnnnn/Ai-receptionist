import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateTwilioRequest } from '@/lib/twilio/validator';
import { uploadCallRecording } from '@/lib/storage/recording-uploader';
import { CallOutcome } from '@/types';

export async function POST(req: NextRequest) {
  try {
    let callSid = '';
    let callDuration = '';
    let callStatus = '';
    let fromNumber = '';
    let toNumber = '';
    let timestamp = '';
    let recordingUrl = '';
    const formParams: Record<string, string> = {};

    const contentType = req.headers.get('content-type') || '';
    const retryCountHeader = req.headers.get('x-twilio-retry-count') || '0';

    if (contentType.includes('application/json')) {
      const json = await req.json().catch(() => ({}));
      callSid = json.CallSid || json.call_sid || json.id || '';
      callDuration = json.CallDuration || json.duration_seconds || json.duration || '';
      callStatus = json.CallStatus || json.call_status || json.status || 'completed';
      fromNumber = json.From || json.from || json.caller_phone || '+91-UNKNOWN';
      toNumber = json.To || json.to || '';
      timestamp = json.Timestamp || json.timestamp || json.ended_at || new Date().toISOString();
      recordingUrl = json.RecordingUrl || json.recording_url || json.audio_url || '';
      Object.entries(json).forEach(([k, v]) => { formParams[k] = String(v); });
    } else {
      const formData = await req.formData().catch(() => new FormData());
      callSid = (formData.get('CallSid') as string) || (formData.get('call_sid') as string) || '';
      callDuration = (formData.get('CallDuration') as string) || (formData.get('duration_seconds') as string) || '';
      callStatus = (formData.get('CallStatus') as string) || (formData.get('status') as string) || 'completed';
      fromNumber = (formData.get('From') as string) || '+91-UNKNOWN';
      toNumber = (formData.get('To') as string) || '';
      timestamp = (formData.get('Timestamp') as string) || new Date().toISOString();
      recordingUrl = (formData.get('RecordingUrl') as string) || (formData.get('recording_url') as string) || '';
      formData.forEach((val, key) => { formParams[key] = String(val); });
    }

    // ── Cryptographic Signature Verification ──
    const validation = await validateTwilioRequest(req, formParams);
    if (!validation.isValid) {
      console.error('Twilio Status Webhook signature validation failed:', validation.reason);
      return new NextResponse('Unauthorized: Invalid Twilio Signature', { status: 403 });
    }

    const durationSec = callDuration ? parseInt(String(callDuration), 10) : 0;
    const normStatus = (callStatus || 'completed').toLowerCase();

    // Map Twilio CallStatus to terminal outcome
    let terminalOutcome: CallOutcome = 'FAQ_ANSWERED';
    if (normStatus === 'no-answer' || normStatus === 'canceled' || normStatus === 'cancelled') {
      terminalOutcome = 'ABANDONED';
    } else if (normStatus === 'busy' || normStatus === 'failed') {
      terminalOutcome = 'ESCALATED';
    } else if (normStatus === 'completed') {
      terminalOutcome = 'FAQ_ANSWERED';
    }

    const clinic = toNumber ? (await db.getClinicByPhone(toNumber)) : (await db.getClinics())[0];
    const clinicId = clinic?.id || '00000000-0000-0000-0000-000000000001';

    // ── Idempotency Check & Terminal Deduplication ──
    const existing = callSid ? (await db.getCallLogBySid(callSid)) : undefined;
    
    // If webhook is a retry and call is already recorded with terminal status and recording
    if (existing && parseInt(retryCountHeader, 10) > 0 && existing.ended_at && (!recordingUrl || existing.recording_url)) {
      return NextResponse.json({
        success: true,
        idempotent_duplicate: true,
        call_sid: callSid,
        outcome: existing.outcome,
        message: 'Idempotent status callback acknowledged without modification.',
      });
    }

    if (existing) {
      // Preserve existing higher-priority outcomes (BOOKED, RESCHEDULED, CANCELLED)
      const finalOutcome: CallOutcome = (
        existing.outcome === 'BOOKED' ||
        existing.outcome === 'RESCHEDULED' ||
        existing.outcome === 'CANCELLED' ||
        existing.outcome === 'ESCALATED'
      ) ? existing.outcome : terminalOutcome;

      await db.updateCallLog(callSid, {
        duration_seconds: durationSec > 0 ? durationSec : existing.duration_seconds,
        ended_at: timestamp || new Date().toISOString(),
        outcome: finalOutcome,
        recording_url: recordingUrl || existing.recording_url,
        transfer_status: normStatus === 'busy' || normStatus === 'failed' ? 'ESCALATED_TO_HUMAN' : undefined,
      });
    } else if (callSid) {
      await db.logCall({
        id: callSid,
        clinic_id: clinicId,
        caller_phone: fromNumber,
        started_at: new Date(Date.now() - (durationSec * 1000)).toISOString(),
        ended_at: timestamp || new Date().toISOString(),
        duration_seconds: durationSec,
        call_intent: 'Inbound Twilio Call',
        outcome: terminalOutcome,
        recording_url: recordingUrl || undefined,
        transfer_status: normStatus === 'busy' || normStatus === 'failed' ? 'ESCALATED_TO_HUMAN' : undefined,
        transcript_preview: `Twilio call finished with terminal status: ${callStatus} (${durationSec}s)`,
      });
    }

    // ── Ingest audio recording to Supabase Storage if URL provided ──
    if (recordingUrl && callSid) {
      // Background async upload to private storage bucket
      uploadCallRecording(clinicId, callSid, recordingUrl).catch((err) => {
        console.error('Failed to upload recording to Supabase Storage:', err);
      });
    }

    return NextResponse.json({
      success: true,
      call_sid: callSid,
      call_status: callStatus,
      duration_seconds: durationSec,
      ended_at: timestamp,
      recording_url: recordingUrl || existing?.recording_url,
      outcome: existing?.outcome || terminalOutcome,
      retry_count: retryCountHeader,
    });
  } catch (error: any) {
    console.error('Error in Twilio Status Webhook:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const callSid = searchParams.get('call_sid') || searchParams.get('CallSid');

  if (callSid) {
    const log = await db.getCallLogBySid(callSid);
    if (log) {
      return NextResponse.json({
        success: true,
        call_log: log,
      });
    }
  }

  return NextResponse.json({
    success: true,
    message: 'Twilio Status Callback webhook is active, idempotent, and healthy.',
    endpoint: '/api/twilio/status',
  });
}
