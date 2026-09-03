import { NextRequest, NextResponse } from 'next/server';
import { processReceptionistTurn } from '@/lib/ai/orchestrator';
import { buildSpeechResponseTwiML, buildHumanTransferTwiML } from '@/lib/twilio/twiml';
import { validateTwilioRequest } from '@/lib/twilio/validator';
import { db } from '@/lib/db';
import { buildLiveContext } from '@/lib/ai/context-injector';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData().catch(() => new FormData());
    const formParams: Record<string, string> = {};
    formData.forEach((val, key) => {
      formParams[key] = String(val);
    });

    // ── Cryptographic Signature Verification ──
    const validation = await validateTwilioRequest(req, formParams);
    if (!validation.isValid) {
      console.error('Twilio Gather Webhook signature validation failed:', validation.reason);
      return new NextResponse('Unauthorized: Invalid Twilio Signature', { status: 403 });
    }

    const speechResult = (formData.get('SpeechResult') as string) || '';
    const fromNumber = (formData.get('From') as string) || '+91-UNKNOWN';
    const callSid = (formData.get('CallSid') as string) || '';

    const { searchParams } = new URL(req.url);
    const clinicId = searchParams.get('clinic_id') || '00000000-0000-0000-0000-000000000001';

    const settings = await db.getClinicSettings(clinicId);

    // ─── Dynamic Context Injection ───
    const liveCtx = buildLiveContext(clinicId);

    // If caller didn't say anything
    if (!speechResult || speechResult.trim() === '') {
      const responseTwiml = buildSpeechResponseTwiML(
        "I'm sorry, I couldn't hear that clearly. Could you please repeat your question?",
        `/api/twilio/gather?clinic_id=${clinicId}`
      );
      return new NextResponse(responseTwiml, {
        headers: { 'Content-Type': 'application/xml; charset=utf-8' },
      });
    }

    // ─── Log user's speech turn ───
    if (callSid) {
      db.addDialogueTurn(callSid, {
        speaker: 'user',
        text: speechResult,
        timestamp: new Date().toISOString(),
      });
    }

    // Process caller's speech turn through the AI orchestrator
    const aiResult = await processReceptionistTurn(
      clinicId,
      speechResult,
      [],
      fromNumber
    );

    const isEscalated = aiResult.call_outcome === 'ESCALATED' || aiResult.tool_called === 'transfer_call_to_human';
    const isEndCall = aiResult.call_outcome === 'COMPLETED' || aiResult.call_outcome === 'BOOKED';

    // ─── Log AI response turn with latency ───
    if (callSid) {
      db.addDialogueTurn(callSid, {
        speaker: 'ai',
        text: aiResult.reply,
        tool_called: aiResult.tool_called,
        latency_ms: aiResult.latency_ms,
        language: aiResult.language,
        timestamp: new Date().toISOString(),
      });

      // Update call log transcript preview and outcome
      const existing = await db.getCallLogBySid(callSid);
      const updatedPreview = existing?.transcript_preview
        ? `${existing.transcript_preview} | User: "${speechResult}" -> AI: "${aiResult.reply}"`
        : `User: "${speechResult}" -> AI: "${aiResult.reply}"`;

      await db.updateCallLog(callSid, {
        transcript_preview: updatedPreview,
        outcome: isEscalated ? 'ESCALATED' : (isEndCall ? 'BOOKED' : 'FAQ_ANSWERED'),
        detected_language: aiResult.language,
      });
    }

    // If turn triggered human handoff / emergency transfer
    if (isEscalated) {
      const handoffNumber = settings?.primary_handoff_number || '+919876500001';
      const transferTwiml = buildHumanTransferTwiML(
        handoffNumber,
        '/api/twilio/status',
        aiResult.reply || 'Connecting you to our clinic front-desk specialist, please hold...'
      );
      return new NextResponse(transferTwiml, {
        headers: { 'Content-Type': 'application/xml; charset=utf-8' },
      });
    }

    // Return continuous conversational response
    const replyTwiml = buildSpeechResponseTwiML(
      aiResult.reply,
      `/api/twilio/gather?clinic_id=${clinicId}`,
      isEndCall
    );

    const response = new NextResponse(replyTwiml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'X-Context-Doctors': String(liveCtx.doctors.length),
        'X-Context-Slots-Tomorrow': liveCtx.open_slots_tomorrow.slice(0, 3).join(', '),
        'X-AI-Latency-Ms': String(aiResult.latency_ms),
        'X-Language-Detected': aiResult.language || 'en',
      },
    });
    return response;
  } catch (error: any) {
    console.error('Error in Twilio Gather Endpoint:', error);
    const fallbackTwiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Aditi" language="en-IN">Thank you for your response. Transferring you to our clinic reception.</Say><Dial>+919876500001</Dial></Response>`;
    return new NextResponse(fallbackTwiml, {
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    });
  }
}
