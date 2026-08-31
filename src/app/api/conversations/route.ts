import { NextRequest, NextResponse } from 'next/server';
import { localStore } from '@/lib/store/local-store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const callId = searchParams.get('call_id');
    const convId = searchParams.get('id');
    const clinicId = searchParams.get('clinic_id');

    if (callId || convId) {
      const targetId = (callId || convId)!;
      const result = localStore.getConversationWithMessages(targetId);
      if (!result) {
        return NextResponse.json({ success: false, error: 'Conversation not found' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        conversation: result.conversation,
        messages: result.messages,
        count: result.messages.length,
      });
    }

    const conversations = localStore.getConversations(clinicId || undefined);
    return NextResponse.json({
      success: true,
      count: conversations.length,
      conversations,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { call_id, conversation_id, speaker, content, latency_ms, tool_called, tool_result } = body;

    if (!content || !speaker) {
      return NextResponse.json({ success: false, error: 'Speaker and content are required' }, { status: 400 });
    }

    let targetConvId = conversation_id;
    if (!targetConvId && call_id) {
      const conv = localStore.getConversationByCallId(call_id) || localStore.createConversation(call_id);
      targetConvId = conv.id;
    }

    if (!targetConvId) {
      return NextResponse.json({ success: false, error: 'Either call_id or conversation_id is required' }, { status: 400 });
    }

    const message = localStore.addMessage(
      targetConvId,
      speaker as 'PATIENT' | 'RECEPTIONIST' | 'SYSTEM',
      content,
      {
        latency_ms,
        tool_called,
        tool_result,
      }
    );

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
