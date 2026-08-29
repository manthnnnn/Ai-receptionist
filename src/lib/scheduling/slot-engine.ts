import { localStore } from '@/lib/store/local-store';

export interface AvailableSlot {
  time_24h: string;     // "10:00"
  time_formatted: string; // "10:00 AM"
  start_iso: string;
  end_iso: string;
}

export function calculateAvailableSlots(
  clinicId: string,
  doctorId: string,
  targetDateStr: string // "YYYY-MM-DD"
): AvailableSlot[] {
  const targetDate = new Date(`${targetDateStr}T00:00:00Z`);
  const weekday = targetDate.getUTCDay(); // 0 = Sunday, 1 = Monday...

  const doctor = localStore.getDoctorById(doctorId);
  if (!doctor || !doctor.is_active) {
    return [];
  }

  // 1. Check clinic holidays
  const holidays = localStore.getClinicHolidays(clinicId);
  const isHoliday = holidays.some((h) => {
    const start = h.start_at.split('T')[0];
    const end = h.end_at.split('T')[0];
    return targetDateStr >= start && targetDateStr <= end;
  });
  if (isHoliday) {
    return [];
  }

  // 2. Check doctor leaves
  const leaves = localStore.getDoctorLeaves(doctorId);
  const isLeave = leaves.some((l) => {
    const start = l.start_at.split('T')[0];
    const end = l.end_at.split('T')[0];
    return targetDateStr >= start && targetDateStr <= end;
  });
  if (isLeave) {
    return [];
  }

  // 3. Get doctor availability for this weekday
  const weeklyAvailability = localStore.getDoctorAvailability(doctorId);
  const daySchedule = weeklyAvailability.find((a) => a.weekday === weekday);
  if (!daySchedule) {
    return []; // Closed on this day (e.g. Sunday)
  }

  // 4. Get breaks for this weekday
  const doctorBreaks = localStore.getDoctorBreaks(doctorId).filter((b) => b.weekday === weekday);

  // 5. Get existing active confirmed appointments for this doctor on target date
  const appointments = localStore.getAppointments(clinicId, {
    date: targetDateStr,
    doctorId,
    status: 'CONFIRMED',
  });

  const bookedSlots = appointments.map((a) => {
    // Extract HH:MM in UTC or local
    const start = new Date(a.start_at);
    const hours = String(start.getUTCHours()).padStart(2, '0');
    const mins = String(start.getUTCMinutes()).padStart(2, '0');
    return `${hours}:${mins}`;
  });

  // 6. Generate candidate slots in 30-min intervals
  const [startH, startM] = daySchedule.start_time.split(':').map(Number);
  const [endH, endM] = daySchedule.end_time.split(':').map(Number);
  const slotDuration = doctor.consultation_duration_minutes || 30;

  const candidateSlots: AvailableSlot[] = [];
  let currentMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  while (currentMinutes + slotDuration <= endMinutes) {
    const slotH = Math.floor(currentMinutes / 60);
    const slotM = currentMinutes % 60;
    const time24h = `${String(slotH).padStart(2, '0')}:${String(slotM).padStart(2, '0')}`;

    // Check if slot falls in a break
    const isInBreak = doctorBreaks.some((b) => {
      const [bStartH, bStartM] = b.start_time.split(':').map(Number);
      const [bEndH, bEndM] = b.end_time.split(':').map(Number);
      const bStart = bStartH * 60 + bStartM;
      const bEnd = bEndH * 60 + bEndM;
      return currentMinutes >= bStart && currentMinutes < bEnd;
    });

    // Check if slot is already booked
    const isBooked = bookedSlots.includes(time24h);

    if (!isInBreak && !isBooked) {
      // Format 12-hour AM/PM
      const ampm = slotH >= 12 ? 'PM' : 'AM';
      const formattedH = slotH % 12 || 12;
      const timeFormatted = `${String(formattedH).padStart(2, '0')}:${String(slotM).padStart(2, '0')} ${ampm}`;

      const endSlotH = Math.floor((currentMinutes + slotDuration) / 60);
      const endSlotM = (currentMinutes + slotDuration) % 60;

      candidateSlots.push({
        time_24h: time24h,
        time_formatted: timeFormatted,
        start_iso: `${targetDateStr}T${time24h}:00Z`,
        end_iso: `${targetDateStr}T${String(endSlotH).padStart(2, '0')}:${String(endSlotM).padStart(2, '0')}:00Z`,
      });
    }

    currentMinutes += slotDuration;
  }

  return candidateSlots;
}
