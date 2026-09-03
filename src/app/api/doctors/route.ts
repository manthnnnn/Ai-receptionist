import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clinicId = searchParams.get('clinic_id') || '00000000-0000-0000-0000-000000000001';

    const doctors = await db.getDoctors(clinicId);

    return NextResponse.json({
      success: true,
      count: doctors.length,
      doctors,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clinic_id, name, specialty, description, consultation_fee, consultation_duration_minutes } = body;

    if (!name || !specialty) {
      return NextResponse.json({ success: false, error: 'Name and specialty are required' }, { status: 400 });
    }

    const newDoc = await db.addDoctor({
      clinic_id: clinic_id || '00000000-0000-0000-0000-000000000001',
      name,
      specialty,
      description: description || '',
      consultation_fee: Number(consultation_fee) || 500,
      consultation_duration_minutes: Number(consultation_duration_minutes) || 30,
      is_active: true,
    });

    return NextResponse.json({
      success: true,
      doctor: newDoc,
      message: 'Doctor added successfully',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
