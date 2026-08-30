import { NextRequest, NextResponse } from 'next/server';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

// Microsoft Edge Neural TTS — same voices as Windows 11, Cortana, Azure Neural
// 100% FREE. No API key. No account. ChatGPT-level naturalness.
//
// Voice quality chart:
//  mr-IN-AarohiNeural  — Marathi female,  warm & natural
//  hi-IN-SwaraNeural   — Hindi female,    most human-sounding Hindi voice ever made
//  en-IN-NeerjaNeural  — Indian English,  clear, confident, empathetic
//  en-US-AriaNeural    — US English,      ChatGPT-like emotional expressiveness

const VOICE_MAP: Record<string, string> = {
  mr: 'mr-IN-AarohiNeural',
  hi: 'hi-IN-SwaraNeural',
  en: 'en-IN-NeerjaNeural',
};

// Max characters per chunk to prevent Edge TTS from hanging on very long text
const CHUNK_SIZE = 180;

function splitToChunks(text: string): string[] {
  // Split on sentence boundaries for natural prosody
  const sentences = text.match(/[^।.!?]+[।.!?]+/g) || [text];
  const chunks: string[] = [];
  let current = '';

  for (const s of sentences) {
    if ((current + s).length > CHUNK_SIZE) {
      if (current.trim()) chunks.push(current.trim());
      current = s;
    } else {
      current += s;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.length > 0 ? chunks : [text];
}

export async function POST(req: NextRequest) {
  try {
    const { text, lang } = await req.json();
    if (!text?.trim()) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    const voice = VOICE_MAP[lang as string] || VOICE_MAP['en'];
    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

    const chunks = splitToChunks(text.trim());
    const audioChunks: Buffer[] = [];

    for (const chunk of chunks) {
      const { audioStream } = await tts.toStream(chunk);
      const chunkBuffers: Buffer[] = [];
      await new Promise<void>((resolve, reject) => {
        audioStream.on('data', (d: Buffer) => chunkBuffers.push(d));
        audioStream.on('end', resolve);
        audioStream.on('error', reject);
      });
      audioChunks.push(Buffer.concat(chunkBuffers));
    }

    const fullAudio = Buffer.concat(audioChunks);

    return new NextResponse(fullAudio, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600',
        'Content-Length': String(fullAudio.length),
      },
    });
  } catch (err) {
    console.error('[TTS] Microsoft Edge TTS error:', err);
    // Graceful degradation — client falls back to browser speech synthesis
    return NextResponse.json({ fallback: true }, { status: 204 });
  }
}
