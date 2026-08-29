import { NextRequest, NextResponse } from 'next/server';
import { localStore } from '@/lib/store/local-store';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const appointmentId = params.id;
    const body = await req.json().catch(() => ({}));
    const reason = body.reason || 'Cancelled by staff/patient';

    const result = localStore.cancelAppointment(appointmentId, reason);

    if (!result.success) {
      return NextResponse.json(result, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
