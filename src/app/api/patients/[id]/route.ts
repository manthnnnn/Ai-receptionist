import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const patientId = params.id;
    const data = await db.getPatientWithHistory(patientId);

    if (!data) {
      return NextResponse.json({ success: false, error: 'Patient not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      patient: data.patient,
      appointments_count: data.appointments.length,
      appointments: data.appointments,
      call_logs_count: data.call_logs.length,
      call_logs: data.call_logs,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
