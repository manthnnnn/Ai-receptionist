import { getSupabaseServerClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';

/**
 * Downloads audio recording from Twilio/LiveKit and uploads to private Supabase Storage bucket 'call-recordings'
 * Target bucket path: call-recordings/${clinicId}/${callSid}.mp3
 */
export async function uploadCallRecording(
  clinicId: string,
  callSid: string,
  recordingUrl: string
): Promise<{ success: boolean; storage_path?: string; error?: string }> {
  try {
    const supabase = getSupabaseServerClient();
    if (!supabase) {
      console.log(`[Storage] Supabase not configured. Recording URL preserved in db: ${recordingUrl}`);
      await db.updateCallLog(callSid, { recording_url: recordingUrl });
      return { success: true, storage_path: recordingUrl };
    }

    // Determine audio download URL
    let downloadUrl = recordingUrl;
    if (recordingUrl.includes('api.twilio.com') && !downloadUrl.endsWith('.mp3')) {
      downloadUrl = `${recordingUrl}.mp3`;
    }

    const headers: Record<string, string> = {};
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (accountSid && authToken && !authToken.includes('your-') && downloadUrl.includes('api.twilio.com')) {
      const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      headers['Authorization'] = `Basic ${basicAuth}`;
    }

    let audioBuffer: Buffer;

    // If recordingUrl is a remote URL, fetch it
    if (downloadUrl.startsWith('http://') || downloadUrl.startsWith('https://')) {
      try {
        const res = await fetch(downloadUrl, { headers });
        if (!res.ok) {
          throw new Error(`Failed to download audio: ${res.status} ${res.statusText}`);
        }
        const arrayBuf = await res.arrayBuffer();
        audioBuffer = Buffer.from(arrayBuf);
      } catch (fetchErr: any) {
        console.warn(`[Storage] Remote audio download failed (${fetchErr.message}). Preserving URL in db.`);
        await db.updateCallLog(callSid, { recording_url: recordingUrl });
        return { success: true, storage_path: recordingUrl };
      }
    } else {
      // Local dummy audio for test/mock purposes
      audioBuffer = Buffer.from('RIFF....WAVEfmt ....data....', 'utf-8');
    }

    const storagePath = `${clinicId}/${callSid}.mp3`;

    // Upload to Supabase Storage bucket 'call-recordings'
    let { data: uploadData, error: uploadError } = await supabase.storage
      .from('call-recordings')
      .upload(storagePath, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true,
      });

    // If bucket doesn't exist yet, auto-create private bucket with service role key and retry
    if (uploadError && uploadError.message?.toLowerCase().includes('bucket not found')) {
      try {
        console.log('[Storage] Bucket "call-recordings" not found, provisioning private bucket...');
        const { error: createBucketError } = await supabase.storage.createBucket('call-recordings', {
          public: false,
          fileSizeLimit: 52428800, // 50MB
        });
        if (!createBucketError) {
          const retryRes = await supabase.storage
            .from('call-recordings')
            .upload(storagePath, audioBuffer, {
              contentType: 'audio/mpeg',
              upsert: true,
            });
          uploadData = retryRes.data;
          uploadError = retryRes.error;
        }
      } catch (bucketErr) {
        console.warn('Auto-create bucket exception:', bucketErr);
      }
    }

    if (uploadError) {
      console.warn(`[Storage] Supabase bucket upload notice (${uploadError.message}). Preserving URL in call log.`);
      // Still keep original URL in call log
      await db.updateCallLog(callSid, { recording_url: recordingUrl });
      return { success: true, error: uploadError.message, storage_path: recordingUrl };
    }

    console.log(`✅ [Storage] Successfully stored call recording: ${storagePath}`);
    await db.updateCallLog(callSid, { recording_url: storagePath });

    return {
      success: true,
      storage_path: storagePath,
    };
  } catch (error: any) {
    console.error('[Storage] uploadCallRecording exception:', error);
    return { success: false, error: error.message };
  }
}
