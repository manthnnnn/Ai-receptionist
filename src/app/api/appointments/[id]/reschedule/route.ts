import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const appointmentId = params.id;
    const body = await req.json();
    const { new_start_at, new_end_at } = body;

    if (!new_start_at) {
      return NextResponse.json({ success: false, error: 'new_start_at is required' }, { status: 400 });
    }

    const calculatedEndAt = new_end_at || new Date(new Date(new_start_at).getTime() + 30 * 60000).toISOString();
    const result = await db.rescheduleAppointment(appointmentId, new_start_at, calculatedEndAt);

    if (!result.success) {
      return NextResponse.json(result, { status: 409 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
