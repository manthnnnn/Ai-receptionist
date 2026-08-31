import { NextRequest, NextResponse } from 'next/server';
import { localStore } from '@/lib/store/local-store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clinicId = searchParams.get('clinic_id') || '00000000-0000-0000-0000-000000000001';

    const holidays = localStore.getClinicHolidays(clinicId);
    return NextResponse.json({
      success: true,
      clinic_id: clinicId,
      count: holidays.length,
      holidays,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.clinic_id || !body.start_at || !body.end_at || !body.reason) {
      return NextResponse.json(
        { success: false, error: 'clinic_id, start_at, end_at, and reason are required' },
        { status: 400 }
      );
    }

    const holiday = localStore.addClinicHoliday({
      clinic_id: body.clinic_id,
      start_at: body.start_at,
      end_at: body.end_at,
      reason: body.reason,
    });

    return NextResponse.json({ success: true, holiday }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Holiday ID is required' }, { status: 400 });
    }

    const deleted = localStore.deleteClinicHoliday(id);
    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
