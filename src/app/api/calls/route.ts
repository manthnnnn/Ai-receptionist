import { NextRequest, NextResponse } from 'next/server';
import { localStore } from '@/lib/store/local-store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clinicId = searchParams.get('clinic_id') || '00000000-0000-0000-0000-000000000001';

    const calls = localStore.getCallLogs(clinicId);

    return NextResponse.json({
      success: true,
      count: calls.length,
      calls,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
