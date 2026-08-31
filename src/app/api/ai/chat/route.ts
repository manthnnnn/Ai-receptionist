import { NextRequest, NextResponse } from 'next/server';
import { processReceptionistTurn } from '@/lib/ai/orchestrator';
import { localStore } from '@/lib/store/local-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clinic_id, message, history, caller_phone, groq_api_key, openai_api_key, language, call_id } = body;

    if (!message) {
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
    }

    const clinicId = clinic_id || '00000000-0000-0000-0000-000000000001';
    const callerPhone = caller_phone || '+91 98765 43210';
    const activeCallId = call_id;

    if (activeCallId) {
      let callLog = localStore.getCallLogById(activeCallId);
      if (!callLog) {
        localStore.logCall({
          id: activeCallId,
          clinic_id: clinicId,
          caller_phone: callerPhone,
          duration_seconds: 0,
          call_intent: 'Live WebRTC / Simulator Interaction',
          outcome: 'FAQ_ANSWERED',
        });
      }
      localStore.addDialogueTurn(activeCallId, {
        speaker: 'user',
        text: message,
        timestamp: new Date().toISOString(),
      });
    }

    const result = await processReceptionistTurn(
      clinicId,
      message,
      history || [],
      callerPhone,
      groq_api_key,
      openai_api_key,
      language
    );

    if (activeCallId) {
      localStore.addDialogueTurn(activeCallId, {
        speaker: 'ai',
        text: result.reply,
        latency_ms: result.latency_ms,
        tool_called: result.tool_called,
        language: result.language,
        timestamp: new Date().toISOString(),
      });

      if (result.call_outcome) {
        localStore.updateCallLog(activeCallId, {
          outcome: result.call_outcome as any,
          detected_language: result.language,
        });
      }
    }

    return NextResponse.json({
      success: true,
      call_id: activeCallId,
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
