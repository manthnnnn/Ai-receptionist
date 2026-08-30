import { NextRequest, NextResponse } from 'next/server';
import { processReceptionistTurn } from '@/lib/ai/orchestrator';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clinic_id, message, history, caller_phone, groq_api_key, openai_api_key, language } = body;

    if (!message) {
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
    }

    const clinicId = clinic_id || '00000000-0000-0000-0000-000000000001';
    const callerPhone = caller_phone || '+91 98765 43210';

    const result = await processReceptionistTurn(
      clinicId,
      message,
      history || [],
      callerPhone,
      groq_api_key,
      openai_api_key,
      language
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
