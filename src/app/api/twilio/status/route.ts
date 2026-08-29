import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData().catch(() => new FormData());
    const callDuration = formData.get('CallDuration') as string;
    const callStatus = formData.get('CallStatus') as string;

    return NextResponse.json({
      success: true,
      call_status: callStatus,
      duration: callDuration,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
