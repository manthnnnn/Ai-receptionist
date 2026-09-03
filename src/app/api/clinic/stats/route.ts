import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clinicId = searchParams.get('clinic_id') || '00000000-0000-0000-0000-000000000001';

    const [analytics, doctors, services] = await Promise.all([
      db.getAnalytics(clinicId),
      db.getDoctors(clinicId),
      db.getServices(clinicId),
    ]);

    return NextResponse.json({
      success: true,
      clinic_id: clinicId,
      stats: {
        ...analytics,
        doctors_count: doctors.length,
        services_count: services.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
