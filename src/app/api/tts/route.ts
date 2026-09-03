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

async function synthesizeSpeech(text: string, lang: string = 'en', customVoice?: string): Promise<Buffer | null> {
  const voice = customVoice || VOICE_MAP[lang] || VOICE_MAP['en'];

  // 1. Try Cartesia Sonic API if API key is present
  const cartesiaKey = process.env.CARTESIA_API_KEY;
  if (cartesiaKey && !cartesiaKey.startsWith('your-')) {
    try {
      const cartesiaRes = await fetch('https://api.cartesia.ai/tts/bytes', {
        method: 'POST',
        headers: {
          'Cartesia-Version': '2024-06-10',
          'X-API-Key': cartesiaKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model_id: 'sonic-multilingual',
          transcript: text,
          voice: {
            mode: 'id',
            id: lang === 'mr' ? '79f8b5fb-2cc8-479a-80df-29f7a7cf1a3e' : 'a0e99841-438c-4a64-b679-ae501e7d6091',
          },
          output_format: {
            container: 'mp3',
            bit_rate: 64000,
            sample_rate: 24000,
          },
        }),
      });

      if (cartesiaRes.ok) {
        const arrayBuf = await cartesiaRes.arrayBuffer();
        return Buffer.from(arrayBuf);
      }
    } catch (cartesiaErr) {
      console.warn('[TTS] Cartesia Sonic synthesis warning, fallback to Edge:', cartesiaErr);
    }
  }

  // 2. Microsoft Edge Neural TTS with 2.5s strict race timeout
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
  return Promise.race([audioPromise, timeoutPromise]);
}

export async function POST(req: NextRequest) {
  try {
    const { text, lang, voice } = await req.json();
    if (!text?.trim()) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    const fullAudio = await synthesizeSpeech(text.trim(), lang, voice);

    if (!fullAudio || fullAudio.length === 0) {
      return NextResponse.json({ fallback: true }, { status: 204 });
    }

    return new NextResponse(new Uint8Array(fullAudio), {
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get('text');
    const lang = searchParams.get('lang') || 'en';
    const voice = searchParams.get('voice') || undefined;

    if (!text?.trim()) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    const fullAudio = await synthesizeSpeech(text.trim(), lang, voice);

    if (!fullAudio || fullAudio.length === 0) {
      return NextResponse.json({ fallback: true }, { status: 204 });
    }

    return new NextResponse(new Uint8Array(fullAudio), {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600',
        'Content-Length': String(fullAudio.length),
      },
    });
  } catch (err) {
    return NextResponse.json({ fallback: true }, { status: 204 });
  }
}
