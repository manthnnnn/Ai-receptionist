import { NextRequest, NextResponse } from 'next/server';

// Production Neural TTS via ElevenLabs or Groq PlayAI
// Falls back gracefully to SSML-enhanced browser TTS guidance
export async function POST(req: NextRequest) {
  try {
    const { text, lang } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;

    // ── Try ElevenLabs Neural TTS (Production Grade) ──────────────
    if (elevenLabsKey) {
      // Pick voice ID based on language
      // Maya: Indian English warm female voice
      const voiceId =
        lang === 'hi' || lang === 'mr'
          ? 'EXAVITQu4vr4xnSDxMaL' // Bella - warm female, works well for Indian languages
          : 'EXAVITQu4vr4xnSDxMaL'; // Bella for all for now

      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': elevenLabsKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.42,
            similarity_boost: 0.82,
            style: 0.38,
            use_speaker_boost: true,
          },
        }),
      });

      if (response.ok) {
        const audioBuffer = await response.arrayBuffer();
        return new NextResponse(audioBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'audio/mpeg',
            'Cache-Control': 'no-cache',
          },
        });
      }
    }

    // No TTS key available — return 204 to signal use browser TTS
    return NextResponse.json({ fallback: true, message: 'No TTS key configured, use browser synthesis' }, { status: 204 });
  } catch (err) {
    console.error('[TTS route error]', err);
    return NextResponse.json({ error: 'TTS failed' }, { status: 500 });
  }
}
