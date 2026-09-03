import { db } from '@/lib/db';
import { calculateAvailableSlots } from '@/lib/scheduling/slot-engine';
import {
  GetClinicInfoSchema,
  GetDoctorInfoSchema,
  CheckAvailabilitySchema,
  BookAppointmentSchema,
  GetPatientAppointmentsSchema,
  CancelAppointmentSchema,
  RescheduleAppointmentSchema,
  TransferToHumanSchema,
  GetClinicFAQsSchema,
  LogDialogueTurnSchema,
} from './tool-schemas';

export const clinicTools = {
  // 1. Get Clinic Information & FAQs
  get_clinic_information: async (args: unknown) => {
    const parsed = GetClinicInfoSchema.parse(args);
    const clinic = await db.getClinicById(parsed.clinic_id);
    const settings = await db.getClinicSettings(parsed.clinic_id);
    const faqs = await db.getClinicFAQs(parsed.clinic_id);

    if (!clinic) {
      return { success: false, error: 'Clinic not found' };
    }

    return {
      success: true,
      clinic: {
        name: clinic.name,
        address: clinic.address,
        phone: clinic.phone_number,
        operating_hours: settings?.operating_hours || {
          mon_fri: '9:30 AM to 7:30 PM',
          sat: '10:00 AM to 4:00 PM',
          sun: 'Closed',
        },
        faqs: faqs.map((f) => ({ question: f.question, answer: f.answer, category: f.category })),
      },
    };
  },

  // 2. Get Doctor Information & Roster
  get_doctor_information: async (args: unknown) => {
    const parsed = GetDoctorInfoSchema.parse(args);
    let doctors = await db.getDoctors(parsed.clinic_id);

    if (parsed.specialty) {
      const specLower = parsed.specialty.toLowerCase();
      doctors = doctors.filter(
        (d) => d.specialty.toLowerCase().includes(specLower) || d.description.toLowerCase().includes(specLower)
      );
    }

    if (parsed.doctor_name) {
      const nameLower = parsed.doctor_name.toLowerCase();
      doctors = doctors.filter((d) => d.name.toLowerCase().includes(nameLower));
    }

    return {
      success: true,
      count: doctors.length,
      doctors: doctors.map((d) => ({
        doctor_id: d.id,
        name: d.name,
        specialty: d.specialty,
        fee: `₹${d.consultation_fee}`,
        slot_duration_mins: d.consultation_duration_minutes,
        description: d.description,
      })),
    };
  },

  // 3. Check Real-Time Availability
  check_availability: async (args: unknown) => {
    const parsed = CheckAvailabilitySchema.parse(args);
    let doctorId = parsed.doctor_id;

    // If doctor name was given instead of doctor ID, find doctor
    if (!doctorId && parsed.doctor_name) {
      const doctors = await db.getDoctors(parsed.clinic_id);
      const matched = doctors.find((d) =>
        d.name.toLowerCase().includes(parsed.doctor_name!.toLowerCase())
      );
      if (matched) {
        doctorId = matched.id;
      }
    }

    // Default to first active doctor if neither was provided
    if (!doctorId) {
      const doctors = await db.getDoctors(parsed.clinic_id);
      if (doctors.length > 0) {
        doctorId = doctors[0].id;
      } else {
        return { success: false, error: 'No active doctors found for this clinic.' };
      }
    }

    const doctor = await db.getDoctorById(doctorId);
    const availableSlots = calculateAvailableSlots(parsed.clinic_id, doctorId, parsed.target_date);

    return {
      success: true,
      doctor: {
        doctor_id: doctor?.id,
        name: doctor?.name,
        specialty: doctor?.specialty,
        fee: `₹${doctor?.consultation_fee}`,
      },
      target_date: parsed.target_date,
      available_slots_count: availableSlots.length,
      available_slots: availableSlots.map((s) => s.time_formatted),
      slots_iso: availableSlots,
    };
  },

  // 4. Book Appointment (Atomic) — with alternative slot negotiation on collision
  book_appointment: async (args: unknown) => {
    const parsed = BookAppointmentSchema.parse(args);
    const doctor = await db.getDoctorById(parsed.doctor_id);
    const durationMins = doctor?.consultation_duration_minutes || 30;

    const startDate = new Date(parsed.start_at);
    const endDate = new Date(startDate.getTime() + durationMins * 60000);

    const result = await db.bookAppointment({
      clinic_id: parsed.clinic_id,
      doctor_id: parsed.doctor_id,
      patient_name: parsed.patient_name,
      patient_phone: parsed.patient_phone,
      start_at: parsed.start_at,
      end_at: endDate.toISOString(),
      booking_source: 'AI_VOICE',
      notes: parsed.notes,
    });

    // ── Alternative Slot Negotiation ──────────────────────────
    // When the requested slot is already taken, find 2-3 nearby
    // available slots and include them in the response so the AI
    // can offer alternatives to the patient.
    if (!result.success && result.error_code === 'SLOT_ALREADY_BOOKED') {
      const targetDateStr = parsed.start_at.split('T')[0]; // "2026-08-31"
      const allSlots = calculateAvailableSlots(parsed.clinic_id, parsed.doctor_id, targetDateStr);

      // Sort slots by proximity to the originally requested time
      const requestedTime = startDate.getTime();
      const sortedSlots = allSlots
        .map((s) => ({ ...s, distance: Math.abs(new Date(s.start_iso).getTime() - requestedTime) }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 3);

      return {
        ...result,
        message: `The ${startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} slot is already booked. Here are nearby available times:`,
        alternative_slots: sortedSlots.map((s) => ({
          time_formatted: s.time_formatted,
          start_iso: s.start_iso,
        })),
        alternative_count: sortedSlots.length,
      };
    }

    return result;
  },

  // 5. Get Patient Appointments (With Verification)
  get_patient_appointments: async (args: unknown) => {
    const parsed = GetPatientAppointmentsSchema.parse(args);
    const appointments = await db.getAppointments(parsed.clinic_id, {
      status: 'CONFIRMED',
    });

    const patientAppointments = appointments.filter((a) => {
      const cleanA = a.patient_phone.replace(/\D/g, '');
      const cleanCaller = parsed.caller_phone.replace(/\D/g, '');
      return cleanA.endsWith(cleanCaller) || cleanCaller.endsWith(cleanA);
    });

    if (patientAppointments.length === 0) {
      return {
        success: true,
        count: 0,
        message: 'No active confirmed appointments found for this phone number.',
        appointments: [],
      };
    }

    return {
      success: true,
      count: patientAppointments.length,
      appointments: patientAppointments.map((a) => ({
        appointment_id: a.id,
        doctor_name: a.doctor_name,
        doctor_specialty: a.doctor_specialty,
        date_and_time: a.start_at,
        status: a.status,
        patient_name: a.patient_name,
      })),
    };
  },

  // 6. Cancel Appointment (With Verification)
  cancel_appointment: async (args: unknown) => {
    const parsed = CancelAppointmentSchema.parse(args);
    const app = await db.getAppointmentById(parsed.appointment_id);

    if (!app) {
      return { success: false, error: 'Appointment not found.' };
    }

    // Identity check: phone match
    const cleanAppPhone = app.patient_phone.replace(/\D/g, '');
    const cleanCaller = parsed.caller_phone.replace(/\D/g, '');
    if (!cleanAppPhone.endsWith(cleanCaller) && !cleanCaller.endsWith(cleanAppPhone)) {
      return {
        success: false,
        error: 'Patient verification failed. Caller phone does not match appointment record.',
      };
    }

    return db.cancelAppointment(parsed.appointment_id, parsed.reason || 'Cancelled via AI Voice');
  },

  // 7. Reschedule Appointment (With Verification)
  reschedule_appointment: async (args: unknown) => {
    const parsed = RescheduleAppointmentSchema.parse(args);
    const app = await db.getAppointmentById(parsed.appointment_id);

    if (!app) {
      return { success: false, error: 'Appointment not found.' };
    }

    // Verification check
    const cleanAppPhone = app.patient_phone.replace(/\D/g, '');
    const cleanCaller = parsed.caller_phone.replace(/\D/g, '');
    if (!cleanAppPhone.endsWith(cleanCaller) && !cleanCaller.endsWith(cleanAppPhone)) {
      return {
        success: false,
        error: 'Patient verification failed. Phone number does not match.',
      };
    }

    const doctor = await db.getDoctorById(app.doctor_id);
    const durationMins = doctor?.consultation_duration_minutes || 30;
    const newStart = new Date(parsed.new_start_at);
    const newEnd = new Date(newStart.getTime() + durationMins * 60000);

    return db.rescheduleAppointment(parsed.appointment_id, parsed.new_start_at, newEnd.toISOString());
  },

  // 8. Transfer to Human Staff
  transfer_to_human: async (args: unknown) => {
    const parsed = TransferToHumanSchema.parse(args);
    const settings = await db.getClinicSettings(parsed.clinic_id);

    const handoffNumber = settings?.primary_handoff_number || '+91-98765-00001';

    // Log escalation outcome
    await db.logCall({
      clinic_id: parsed.clinic_id,
      caller_phone: '+91 Caller',
      duration_seconds: 45,
      call_intent: `Escalation: ${parsed.reason}`,
      outcome: 'ESCALATED',
      transfer_status: `Transferred to ${handoffNumber}`,
    });

    return {
      success: true,
      transfer_required: true,
      handoff_number: handoffNumber,
      message: `I am transferring your call to our clinic front-desk team at ${handoffNumber}. Please hold on for a moment.`,
    };
  },

  // 9. Get Clinic FAQs by Category
  get_clinic_faqs: async (args: unknown) => {
    const parsed = GetClinicFAQsSchema.parse(args);
    let faqs = await db.getClinicFAQs(parsed.clinic_id);
    if (parsed.category) {
      const catLower = parsed.category.toLowerCase();
      faqs = faqs.filter((f) => f.category.toLowerCase() === catLower);
    }

    if (faqs.length === 0) {
      return {
        success: true,
        count: 0,
        category: parsed.category || 'all',
        message: 'No FAQs found for the requested category.',
        faqs: [],
      };
    }

    return {
      success: true,
      count: faqs.length,
      category: parsed.category || 'all',
      faqs: faqs.map((f) => ({
        category: f.category,
        question: f.question,
        answer: f.answer,
      })),
    };
  },

  // 10. Log Dialogue Turn
  log_dialogue_turn: async (args: unknown) => {
    const parsed = LogDialogueTurnSchema.parse(args);
    const result = db.addDialogueTurn(parsed.call_sid, {
      speaker: parsed.speaker,
      text: parsed.text,
      tool_called: parsed.tool_called,
      latency_ms: parsed.latency_ms,
      language: parsed.language,
      timestamp: new Date().toISOString(),
    });

    if (!result) {
      return {
        success: false,
        error: `Call log not found for SID: ${parsed.call_sid}`,
      };
    }

    return {
      success: true,
      call_sid: parsed.call_sid,
      turn_index: (result.dialogue_turns?.length || 1) - 1,
      total_turns: result.dialogue_turns?.length || 1,
      total_latency_ms: result.total_latency_ms || 0,
    };
  },
};
