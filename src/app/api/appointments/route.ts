import { NextRequest, NextResponse } from 'next/server';
import { localStore } from '@/lib/store/local-store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clinicId = searchParams.get('clinic_id') || '00000000-0000-0000-0000-000000000001';
    const date = searchParams.get('date') || undefined;
    const doctorId = searchParams.get('doctor_id') || undefined;
    const status = searchParams.get('status') || undefined;

    const appointments = localStore.getAppointments(clinicId, {
      date,
      doctorId,
      status,
    });

    return NextResponse.json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clinic_id, doctor_id, patient_name, patient_phone, start_at, end_at, notes, booking_source } = body;

    if (!doctor_id || !patient_name || !patient_phone || !start_at) {
      return NextResponse.json(
        { success: false, error: 'doctor_id, patient_name, patient_phone, and start_at are required' },
        { status: 400 }
      );
    }

    const doctor = localStore.getDoctorById(doctor_id);
    const durationMins = doctor?.consultation_duration_minutes || 30;
    const calculatedEndAt = end_at || new Date(new Date(start_at).getTime() + durationMins * 60000).toISOString();

    const result = localStore.bookAppointmentAtomic({
      clinic_id: clinic_id || '00000000-0000-0000-0000-000000000001',
      doctor_id,
      patient_name,
      patient_phone,
      start_at,
      end_at: calculatedEndAt,
      booking_source: booking_source || 'MANUAL',
      notes,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 409 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
