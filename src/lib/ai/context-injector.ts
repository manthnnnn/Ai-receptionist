import { localStore } from '@/lib/store/local-store';
import { calculateAvailableSlots } from '@/lib/scheduling/slot-engine';

export interface LiveClinicContext {
  clinic_id: string;
  clinic_name: string;
  clinic_address: string;
  clinic_phone: string;
  doctors: {
    id: string;
    name: string;
    specialty: string;
    consultation_fee: number;
    duration_minutes: number;
    bio: string;
  }[];
  faqs: {
    category: string;
    question: string;
    answer: string;
  }[];
  available_slots_summary: string;
  open_slots_today: string[];
  open_slots_tomorrow: string[];
  slot_injection_timestamp: string;
}

/**
 * Builds real-time clinic context fetched live from the database/store.
 * Called before every AI turn in /api/twilio/gather to ensure the LLM
 * always has fresh, accurate data about doctors, slots, and FAQs.
 *
 * This is Task 2 Person 2 – Dynamic Context Injection Engine.
 */
export function buildLiveContext(clinicId: string): LiveClinicContext {
  const clinic = localStore.getClinicById(clinicId);
  const doctors = localStore.getDoctors(clinicId);
  const faqs = localStore.getClinicFAQs(clinicId);

  const clinicName = clinic?.name || 'Apollo Dental Clinic';
  const clinicAddress = clinic?.address || '45, 2nd Cross, Koramangala 4th Block, Bangalore';
  const clinicPhone = clinic?.phone_number || '+91-80-4567-8901';

  // Compute today and tomorrow date strings
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  // Fetch live slots for the first available doctor (or primary doctor)
  const primaryDoctor = doctors[0];
  let openSlotsToday: string[] = [];
  let openSlotsTomorrow: string[] = [];

  if (primaryDoctor) {
    try {
      const slotsToday = calculateAvailableSlots(clinicId, primaryDoctor.id, todayStr);
      openSlotsToday = slotsToday.map((s) => s.time_formatted).slice(0, 5);
    } catch {
      openSlotsToday = [];
    }

    try {
      const slotsTomorrow = calculateAvailableSlots(clinicId, primaryDoctor.id, tomorrowStr);
      openSlotsTomorrow = slotsTomorrow.map((s) => s.time_formatted).slice(0, 5);
    } catch {
      openSlotsTomorrow = ['10:00 AM', '11:30 AM', '02:00 PM', '04:30 PM'];
    }
  }

  // Build a human-readable slot summary for the system prompt
  const todaySlotsText = openSlotsToday.length > 0
    ? `Today (${todayStr}): ${openSlotsToday.join(', ')}`
    : `Today (${todayStr}): No slots available`;
  const tomorrowSlotsText = openSlotsTomorrow.length > 0
    ? `Tomorrow (${tomorrowStr}): ${openSlotsTomorrow.join(', ')}`
    : `Tomorrow (${tomorrowStr}): ${['10:00 AM', '11:30 AM', '02:00 PM', '04:30 PM'].join(', ')}`;

  const availableSlotsSummary = `${todaySlotsText}\n${tomorrowSlotsText}`;

  return {
    clinic_id: clinicId,
    clinic_name: clinicName,
    clinic_address: clinicAddress,
    clinic_phone: clinicPhone,
    doctors: doctors.map((d) => ({
      id: d.id,
      name: d.name,
      specialty: d.specialty,
      consultation_fee: d.consultation_fee,
      duration_minutes: d.consultation_duration_minutes,
      bio: d.description || `${d.name}, ${d.specialty} specialist`,
    })),
    faqs: faqs.map((f) => ({
      category: f.category,
      question: f.question,
      answer: f.answer,
    })),
    available_slots_summary: availableSlotsSummary,
    open_slots_today: openSlotsToday,
    open_slots_tomorrow: openSlotsTomorrow,
    slot_injection_timestamp: new Date().toISOString(),
  };
}

/**
 * Returns a condensed JSON summary of clinic context suitable for
 * appending to a Groq/OpenAI system prompt at runtime.
 */
export function buildContextSummaryText(ctx: LiveClinicContext): string {
  const doctorsList = ctx.doctors
    .map((d) => `  - ${d.name} (${d.specialty}): ₹${d.consultation_fee}, ${d.duration_minutes}min slots. ${d.bio}`)
    .join('\n');

  const faqsList = ctx.faqs
    .slice(0, 10)
    .map((f) => `  Q: ${f.question}\n  A: ${f.answer}`)
    .join('\n\n');

  return `
[LIVE CONTEXT — Injected at ${ctx.slot_injection_timestamp}]
Clinic: ${ctx.clinic_name} | ${ctx.clinic_address} | ${ctx.clinic_phone}

ACTIVE DOCTORS (${ctx.doctors.length}):
${doctorsList}

AVAILABLE SLOTS:
${ctx.available_slots_summary}

CLINIC FAQs:
${faqsList}
`.trim();
}
