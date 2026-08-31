import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { target_url, event, data, clinic_id } = body;

    if (!event || !data) {
      return NextResponse.json(
        { success: false, error: 'event and data payload are required' },
        { status: 400 }
      );
    }

    const payload = {
      event,
      clinic_id: clinic_id || '00000000-0000-0000-0000-000000000001',
      timestamp: new Date().toISOString(),
      data,
    };

    // If external target URL provided, attempt dispatch
    let dispatchStatus = 'LOGGED_ONLY';
    if (target_url && target_url.startsWith('http')) {
      try {
        const response = await fetch(target_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'User-Agent': 'ClinicAI-Outbound-Webhook/1.0' },
          body: JSON.stringify(payload),
        });
        dispatchStatus = response.ok ? 'DELIVERED' : `HTTP_${response.status}`;
      } catch (err: any) {
        dispatchStatus = `DISPATCH_FAILED: ${err.message}`;
      }
    }

    return NextResponse.json({
      success: true,
      event,
      status: dispatchStatus,
      dispatched_payload: payload,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
