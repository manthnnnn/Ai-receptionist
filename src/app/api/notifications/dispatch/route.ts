import { NextRequest, NextResponse } from 'next/server';
import { localStore } from '@/lib/store/local-store';
import { sendAppointmentConfirmationNotification } from '@/lib/notifications/dispatch';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { appointment_id, channels = ['SMS', 'WHATSAPP'] } = body;

    if (!appointment_id) {
      return NextResponse.json(
        { success: false, error: 'appointment_id is required' },
        { status: 400 }
      );
    }

    const appointment = localStore.getAppointmentById(appointment_id);
    if (!appointment) {
      return NextResponse.json(
        { success: false, error: 'Appointment not found' },
        { status: 404 }
      );
    }

    const clinic = localStore.getClinicById(appointment.clinic_id);
    const doctor = localStore.getDoctorById(appointment.doctor_id);

    const result = await sendAppointmentConfirmationNotification({
      appointment,
      clinic,
      doctor,
      channels,
    });

    localStore.updateAppointmentNotificationStatus(
      appointment.id,
      result.sms_status,
      result.whatsapp_status,
      result.logs
    );

    return NextResponse.json({
      success: true,
      data: result,
      message: `Notification successfully dispatched via ${channels.join(' & ')}.`,
    });
  } catch (error: any) {
    console.error('Notification dispatch error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
