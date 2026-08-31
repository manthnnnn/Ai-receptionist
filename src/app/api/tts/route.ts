import { NextRequest, NextResponse } from 'next/server';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

const VOICE_MAP: Record<string, string> = {
  mr: 'mr-IN-AarohiNeural',
  hi: 'hi-IN-SwaraNeural',
  en: 'en-IN-NeerjaNeural',
};

const CHUNK_SIZE = 180;

function splitToChunks(text: string): string[] {
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

    // Wrap in a strict 2.5s timeout promise so it never hangs the client
    const audioPromise = (async () => {
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

      return Buffer.concat(audioChunks);
    })();

    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500));
    const fullAudio = await Promise.race([audioPromise, timeoutPromise]);

    if (!fullAudio || fullAudio.length === 0) {
      // Fast fallback to browser speech synthesis
      return NextResponse.json({ fallback: true }, { status: 204 });
    }

    return new NextResponse(fullAudio, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600',
        'Content-Length': String(fullAudio.length),
      },
    });
  } catch (err) {
    console.warn('[TTS] Neural TTS fallback to browser engine:', err);
    return NextResponse.json({ fallback: true }, { status: 204 });
  }
}
