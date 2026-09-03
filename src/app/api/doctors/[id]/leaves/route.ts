import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const doctorId = params.id;
    const leaves = await db.getDoctorLeaves(doctorId);
    return NextResponse.json({
      success: true,
      doctor_id: doctorId,
      count: leaves.length,
      leaves,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const doctorId = params.id;
    const body = await req.json();

    if (!body.start_at || !body.end_at) {
      return NextResponse.json(
        { success: false, error: 'start_at and end_at timestamps are required' },
        { status: 400 }
      );
    }

    const leave = await db.addDoctorLeave({
      doctor_id: doctorId,
      start_at: body.start_at,
      end_at: body.end_at,
      reason: body.reason || 'Personal Leave',
    });

    return NextResponse.json({ success: true, leave }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(req.url);
    const leaveId = searchParams.get('leave_id');
    if (!leaveId) {
      return NextResponse.json({ success: false, error: 'leave_id is required' }, { status: 400 });
    }

    const deleted = await db.deleteDoctorLeave(leaveId);
    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
