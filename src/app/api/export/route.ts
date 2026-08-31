import { NextRequest, NextResponse } from 'next/server';
import { localStore } from '@/lib/store/local-store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'appointments';
    const clinicId = searchParams.get('clinic_id') || '00000000-0000-0000-0000-000000000001';
    const format = (searchParams.get('format') || 'csv').toLowerCase();

    if (type === 'appointments') {
      const appointments = localStore.getAppointments(clinicId);

      if (format === 'json') {
        return NextResponse.json({ success: true, count: appointments.length, appointments });
      }

      // Generate CSV
      const headers = ['ID', 'Patient Name', 'Patient Phone', 'Doctor', 'Specialty', 'Date & Time', 'Status', 'Booking Source', 'Notes'];
      const rows = appointments.map((a) => [
        a.id,
        `"${(a.patient_name || '').replace(/"/g, '""')}"`,
        `"${a.patient_phone || ''}"`,
        `"${(a.doctor_name || '').replace(/"/g, '""')}"`,
        `"${(a.doctor_specialty || '').replace(/"/g, '""')}"`,
        `"${a.start_at || ''}"`,
        a.status,
        a.booking_source || 'AI_VOICE',
        `"${(a.notes || '').replace(/"/g, '""')}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="appointments_${clinicId.slice(0, 8)}.csv"`,
        },
      });
    }

    if (type === 'calls') {
      const calls = localStore.getCallLogs(clinicId);

      if (format === 'json') {
        return NextResponse.json({ success: true, count: calls.length, calls });
      }

      // Generate CSV
      const headers = ['Call ID', 'Caller Phone', 'Started At', 'Duration (s)', 'Intent', 'Outcome', 'Latency (ms)', 'Language', 'Recording URL'];
      const rows = calls.map((c) => [
        c.id,
        `"${c.caller_phone || ''}"`,
        `"${c.started_at || c.created_at}"`,
        c.duration_seconds || 0,
        `"${(c.call_intent || '').replace(/"/g, '""')}"`,
        c.outcome,
        c.total_latency_ms || 575,
        c.detected_language || 'en',
        `"${c.recording_url || ''}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="calls_${clinicId.slice(0, 8)}.csv"`,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid export type. Supported types: "appointments", "calls"' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
