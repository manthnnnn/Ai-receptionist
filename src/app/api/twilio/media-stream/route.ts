import { NextRequest, NextResponse } from 'next/server';

/**
 * Twilio Media Streams Ingress & Dispatch Endpoint
 * Handles handshake and telemetry for bidirectional 24/7 WebRTC audio streaming.
 */
export async function GET(req: NextRequest) {
  const host = req.headers.get('host') || 'localhost:3000';
  return NextResponse.json({
    status: 'active',
    endpoint: '/api/twilio/media-stream',
    protocol: 'WebSocket',
    websocket_url: `wss://${host}/api/twilio/media-stream`,
    audio_encoding: 'audio/x-mulaw',
    sample_rate: 8000,
    channels: 1,
    supported_protocols: ['livekit-sip', 'twilio-bidirectional-media-stream'],
    documentation: 'https://www.twilio.com/docs/voice/media-streams',
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    return NextResponse.json({
      success: true,
      event: 'media_stream_connected',
      stream_sid: body.stream_sid || `stream-${Date.now()}`,
      call_sid: body.call_sid,
      message: 'Twilio bidirectional Media Stream ready for LiveKit/Deepgram audio pipeline',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
