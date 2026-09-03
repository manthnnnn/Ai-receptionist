import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const doctorId = params.id;
    const body = await req.json();

    const existingDoctor = await db.getDoctorById(doctorId);
    if (!existingDoctor) {
      return NextResponse.json(
        { success: false, error: 'Doctor not found' },
        { status: 404 }
      );
    }

    const updates: any = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.specialty !== undefined) updates.specialty = body.specialty;
    if (body.description !== undefined) updates.description = body.description;
    if (body.consultation_fee !== undefined) updates.consultation_fee = Number(body.consultation_fee);
    if (body.consultation_duration_minutes !== undefined) updates.consultation_duration_minutes = Number(body.consultation_duration_minutes);
    if (body.is_active !== undefined) updates.is_active = Boolean(body.is_active);

    const updated = await db.updateDoctor(doctorId, updates);

    return NextResponse.json({
      success: true,
      doctor: updated,
      message: 'Doctor details and fee updated successfully.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const doctor = await db.getDoctorById(params.id);
    if (!doctor) {
      return NextResponse.json({ success: false, error: 'Doctor not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, doctor });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
