import { NextRequest, NextResponse } from 'next/server';
import { uploadCallRecording } from '@/lib/storage/recording-uploader';
import { validateTwilioRequest } from '@/lib/twilio/validator';
import { db } from '@/lib/db';

/**
 * Inbound Webhook for Twilio / LiveKit Recording Status Callbacks
 * Invoked asynchronously when recording audio file has finished transcoding.
 */
export async function POST(req: NextRequest) {
  try {
    const formParams: Record<string, string> = {};
    let callSid = '';
    let recordingUrl = '';
    let recordingDuration = '';
    let recordingSid = '';

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const json = await req.json().catch(() => ({}));
      callSid = json.CallSid || json.call_sid || json.id || '';
      recordingUrl = json.RecordingUrl || json.recording_url || '';
      recordingDuration = json.RecordingDuration || json.duration || '';
      recordingSid = json.RecordingSid || json.recording_sid || '';
      Object.entries(json).forEach(([k, v]) => { formParams[k] = String(v); });
    } else {
      const formData = await req.formData().catch(() => new FormData());
      callSid = (formData.get('CallSid') as string) || (formData.get('call_sid') as string) || '';
      recordingUrl = (formData.get('RecordingUrl') as string) || (formData.get('recording_url') as string) || '';
      recordingDuration = (formData.get('RecordingDuration') as string) || '';
      recordingSid = (formData.get('RecordingSid') as string) || '';
      formData.forEach((val, key) => { formParams[key] = String(val); });
    }

    // Cryptographic validation
    const validation = await validateTwilioRequest(req, formParams);
    if (!validation.isValid) {
      console.warn('Recording callback signature verification failed:', validation.reason);
      return new NextResponse('Unauthorized: Invalid Signature', { status: 403 });
    }

    if (!callSid || !recordingUrl) {
      return NextResponse.json({ success: false, error: 'CallSid and RecordingUrl are required' }, { status: 400 });
    }

    const callLog = (await db.getCallLogBySid(callSid)) || (await db.getCallLogById(callSid));
    const clinicId = callLog?.clinic_id || '00000000-0000-0000-0000-000000000001';

    // Ingest into private Supabase Storage bucket
    const uploadResult = await uploadCallRecording(clinicId, callSid, recordingUrl);

    // Update duration if provided
    if (recordingDuration) {
      const durSec = parseInt(recordingDuration, 10);
      if (!isNaN(durSec) && durSec > 0) {
        await db.updateCallLog(callSid, { duration_seconds: durSec });
      }
    }

    return NextResponse.json({
      success: true,
      call_sid: callSid,
      recording_sid: recordingSid,
      storage_path: uploadResult.storage_path,
      message: 'Call recording audio processed and uploaded successfully.',
    });
  } catch (error: any) {
    console.error('Error in recording callback webhook:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'active',
    endpoint: '/api/webhooks/recording-callback',
    description: 'Receives asynchronous Twilio / LiveKit recording callbacks and uploads audio to private Supabase Storage.',
  });
}
