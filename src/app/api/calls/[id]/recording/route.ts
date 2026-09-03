import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const callId = params.id;
    const call = (await db.getCallLogById(callId)) || (await db.getCallLogBySid(callId));

    if (!call) {
      return NextResponse.json({ success: false, error: 'Call record not found' }, { status: 404 });
    }

    const supabase = getSupabaseServerClient();
    const storagePath = `${call.clinic_id}/${call.id}.mp3`;

    if (supabase) {
      try {
        // Try generating 1-hour (3600s) expiring signed URL from private 'call-recordings' bucket
        const { data, error } = await supabase.storage
          .from('call-recordings')
          .createSignedUrl(storagePath, 3600);

        if (!error && data?.signedUrl) {
          return NextResponse.json({
            success: true,
            call_id: call.id,
            clinic_id: call.clinic_id,
            signed_url: data.signedUrl,
            expires_in: 3600,
            storage_provider: 'SUPABASE_PRIVATE_STORAGE',
          });
        }
      } catch (storageErr) {
        console.warn('Supabase storage signed URL generation warning:', storageErr);
      }
    }

    // Fallback 1: Return stored remote recording_url if present
    if (call.recording_url && (call.recording_url.startsWith('http://') || call.recording_url.startsWith('https://'))) {
      return NextResponse.json({
        success: true,
        call_id: call.id,
        clinic_id: call.clinic_id,
        signed_url: call.recording_url,
        expires_in: 3600,
        storage_provider: 'REMOTE_RECORDING_URL',
      });
    }

    // Fallback 2: Generate dynamic speech audio endpoint for simulated/local calls
    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = req.url.startsWith('https') ? 'https' : 'http';
    const previewText = encodeURIComponent(call.transcript_preview || 'Call recorded successfully.');
    const simulatedAudioUrl = `${protocol}://${host}/api/tts?text=${previewText}&voice=en-IN-NeerjaNeural`;

    return NextResponse.json({
      success: true,
      call_id: call.id,
      clinic_id: call.clinic_id,
      signed_url: simulatedAudioUrl,
      expires_in: 3600,
      storage_provider: 'SYNTHESIZED_PLAYBACK_FALLBACK',
    });
  } catch (error: any) {
    console.error('Error generating recording signed URL:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
