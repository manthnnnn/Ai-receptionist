import { NextRequest, NextResponse } from 'next/server';
import { calculateAvailableSlots } from '@/lib/scheduling/slot-engine';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clinicId = searchParams.get('clinic_id') || '00000000-0000-0000-0000-000000000001';
    let doctorId = searchParams.get('doctor_id');
    const dateStr = searchParams.get('date');

    if (!dateStr) {
      return NextResponse.json({ success: false, error: 'Date parameter (YYYY-MM-DD) is required' }, { status: 400 });
    }

    if (!doctorId) {
      const docs = await db.getDoctors(clinicId);
      if (docs.length > 0) {
        doctorId = docs[0].id;
      } else {
        return NextResponse.json({ success: false, error: 'No doctors found' }, { status: 404 });
      }
    }

    const slots = calculateAvailableSlots(clinicId, doctorId, dateStr);

    return NextResponse.json({
      success: true,
      doctor_id: doctorId,
      date: dateStr,
      available_slots_count: slots.length,
      available_slots: slots,
      slots,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
