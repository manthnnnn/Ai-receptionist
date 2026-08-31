import { 
  Clinic, ClinicSettings, Doctor, DoctorAvailability, DoctorBreak, 
  DoctorLeave, ClinicHoliday, Service, Patient, Appointment, 
  CallLog, ClinicFAQ, ClinicStats, DialogueTurn, Conversation, Message
} from '@/types';

class LocalStore {
  private clinics: Clinic[] = [];
  private settings: ClinicSettings[] = [];
  private doctors: Doctor[] = [];
  private availability: DoctorAvailability[] = [];
  private breaks: DoctorBreak[] = [];
  private leaves: DoctorLeave[] = [];
  private holidays: ClinicHoliday[] = [];
  private services: Service[] = [];
  private patients: Patient[] = [];
  private appointments: Appointment[] = [];
  private callLogs: CallLog[] = [];
  private faqs: ClinicFAQ[] = [];
  private conversations: Conversation[] = [];
  private messages: Message[] = [];

  constructor() {
    this.seed();
  }

  private seed() {
    // 1. Clinics
    this.clinics = [
      {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Apollo Dental Clinic',
        address: '45, 2nd Cross, Koramangala 4th Block, Bangalore - 560034',
        phone_number: '+91-80-4567-8901',
        timezone: 'Asia/Kolkata',
        agent_enabled: true,
        agent_name: 'Maya',
        primary_language: 'mr',
        voice_id: 'mr-IN-AarohiNeural',
        plan_tier: 'growth',
        monthly_minutes_used: 142,
        monthly_minute_limit: 1000,
        primary_handoff_number: '+91-98765-00001',
        backup_handoff_number: '+91-98765-00009',
        ai_greeting: 'नमस्कार! Apollo Dental Clinic मध्ये आपले स्वागत आहे. मी माया, आपली काय मदत करू?',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        name: 'Radiance Dermatology & Laser Center',
        address: '12, Indiranagar 100ft Road, Bangalore - 560038',
        phone_number: '+91-80-4567-8902',
        timezone: 'Asia/Kolkata',
        agent_enabled: true,
        agent_name: 'Priya',
        primary_language: 'hi',
        voice_id: 'hi-IN-SwaraNeural',
        plan_tier: 'enterprise',
        monthly_minutes_used: 320,
        monthly_minute_limit: 2500,
        primary_handoff_number: '+91-98765-00002',
        ai_greeting: 'नमस्ते! Radiance Dermatology Center में आपका स्वागत है। मैं प्रिया, आपकी क्या सहायता करूँ?',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    // 2. Settings
    this.settings = [
      {
        id: 'set-1',
        clinic_id: '00000000-0000-0000-0000-000000000001',
        operating_hours: {
          mon: '09:30-19:30',
          tue: '09:30-19:30',
          wed: '09:30-19:30',
          thu: '09:30-19:30',
          fri: '09:30-19:30',
          sat: '10:00-16:00',
          sun: 'closed',
        },
        ai_greeting: 'Hello! Thank you for calling Apollo Dental Clinic. How can I help you today?',
        ai_enabled: true,
        primary_handoff_number: '+91-98765-00001',
        backup_handoff_number: '+91-98765-00009',
      },
      {
        id: 'set-2',
        clinic_id: '00000000-0000-0000-0000-000000000002',
        operating_hours: {
          mon: '10:00-19:00',
          tue: '10:00-19:00',
          wed: '10:00-19:00',
          thu: '10:00-19:00',
          fri: '10:00-19:00',
          sat: '10:00-15:00',
          sun: 'closed',
        },
        ai_greeting: 'Welcome to Radiance Dermatology & Laser Center. How may I assist you?',
        ai_enabled: true,
        primary_handoff_number: '+91-98765-00002',
      },
    ];

    // 3. Doctors
    this.doctors = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        clinic_id: '00000000-0000-0000-0000-000000000001',
        name: 'Dr. Ashish Verma',
        specialty: 'Endodontist & Root Canal Specialist',
        description: 'BDS, MDS (Endodontics - Manipal) with 12+ years experience in painless root canal treatments and microscopic dentistry.',
        consultation_duration_minutes: 30,
        consultation_fee: 750,
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: '11111111-1111-1111-1111-111111111112',
        clinic_id: '00000000-0000-0000-0000-000000000001',
        name: 'Dr. Neha Kulkarni',
        specialty: 'Orthodontist & Clear Aligners',
        description: 'BDS, MDS (Orthodontics - AIIMS). Certified Invisalign Diamond Provider specializing in smile design and braces.',
        consultation_duration_minutes: 30,
        consultation_fee: 800,
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: '11111111-1111-1111-1111-111111111113',
        clinic_id: '00000000-0000-0000-0000-000000000001',
        name: 'Dr. Rohan Mehta',
        specialty: 'General Dentist & Implantologist',
        description: 'BDS, Fellowship in Implantology. Expert in preventative dentistry, cleanings, and surgical dental implants.',
        consultation_duration_minutes: 30,
        consultation_fee: 500,
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: '22222222-2222-2222-2222-222222222221',
        clinic_id: '00000000-0000-0000-0000-000000000002',
        name: 'Dr. Sunita Rao',
        specialty: 'Cosmetic Dermatologist',
        description: 'MD (Dermatology). Specialist in anti-aging treatments, chemical peels, and acne therapies.',
        consultation_duration_minutes: 30,
        consultation_fee: 1000,
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        clinic_id: '00000000-0000-0000-0000-000000000002',
        name: 'Dr. Vikram Patel',
        specialty: 'Laser Specialist',
        description: 'MD, DVD (Skin). Expert in advanced laser scar removal, tattoo removal, and pigmentation.',
        consultation_duration_minutes: 30,
        consultation_fee: 900,
        is_active: true,
        created_at: new Date().toISOString(),
      },
    ];

    // 4. Availability & Breaks (Dr. Ashish Verma)
    [1, 2, 3, 4, 5].forEach((weekday) => {
      this.availability.push({
        id: `avail-${weekday}`,
        doctor_id: '11111111-1111-1111-1111-111111111111',
        weekday,
        start_time: '10:00',
        end_time: '19:00',
      });
      this.breaks.push({
        id: `break-${weekday}`,
        doctor_id: '11111111-1111-1111-1111-111111111111',
        weekday,
        start_time: '13:00',
        end_time: '14:00',
      });
    });
    this.availability.push({
      id: 'avail-sat',
      doctor_id: '11111111-1111-1111-1111-111111111111',
      weekday: 6,
      start_time: '10:00',
      end_time: '14:00',
    });

    // 5. Patients
    this.patients = [
      {
        id: '33333333-3333-3333-3333-333333333331',
        clinic_id: '00000000-0000-0000-0000-000000000001',
        name: 'Priya Sundaram',
        phone: '+91 98450 12345',
        email: 'priya.s@example.com',
        created_at: new Date().toISOString(),
      },
      {
        id: '33333333-3333-3333-3333-333333333332',
        clinic_id: '00000000-0000-0000-0000-000000000001',
        name: 'Rahul Sharma',
        phone: '+91 98765 43210',
        email: 'rahul.sharma@example.com',
        created_at: new Date().toISOString(),
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        clinic_id: '00000000-0000-0000-0000-000000000001',
        name: 'Ananya Iyer',
        phone: '+91 97312 34567',
        email: 'ananya.iyer@example.com',
        created_at: new Date().toISOString(),
      },
      {
        id: '33333333-3333-3333-3333-333333333334',
        clinic_id: '00000000-0000-0000-0000-000000000002',
        name: 'Kavita Reddy',
        phone: '+91 99001 55443',
        email: 'kavita.reddy@example.com',
        created_at: new Date().toISOString(),
      },
    ];

    // 6. Appointments
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    const dayAfterStr = dayAfter.toISOString().split('T')[0];

    this.appointments = [
      {
        id: '44444444-4444-4444-4444-444444444441',
        clinic_id: '00000000-0000-0000-0000-000000000001',
        doctor_id: '11111111-1111-1111-1111-111111111111',
        doctor_name: 'Dr. Ashish Verma',
        doctor_specialty: 'Endodontist & Root Canal Specialist',
        patient_id: '33333333-3333-3333-3333-333333333331',
        patient_name: 'Priya Sundaram',
        patient_phone: '+91 98450 12345',
        start_at: `${tomorrowStr}T11:00:00Z`,
        end_at: `${tomorrowStr}T11:30:00Z`,
        status: 'CONFIRMED',
        booking_source: 'AI_VOICE',
        sms_status: 'DELIVERED',
        whatsapp_status: 'DELIVERED',
        notes: 'Follow-up root canal crown measurement',
        created_at: new Date().toISOString(),
      },
      {
        id: '44444444-4444-4444-4444-444444444442',
        clinic_id: '00000000-0000-0000-0000-000000000001',
        doctor_id: '11111111-1111-1111-1111-111111111111',
        doctor_name: 'Dr. Ashish Verma',
        doctor_specialty: 'Endodontist & Root Canal Specialist',
        patient_id: '33333333-3333-3333-3333-333333333332',
        patient_name: 'Rahul Sharma',
        patient_phone: '+91 98765 43210',
        start_at: `${tomorrowStr}T16:30:00Z`,
        end_at: `${tomorrowStr}T17:00:00Z`,
        status: 'CONFIRMED',
        booking_source: 'AI_VOICE',
        sms_status: 'DELIVERED',
        whatsapp_status: 'DELIVERED',
        notes: 'Patient complained of mild molar sensitivity',
        created_at: new Date().toISOString(),
      },
      {
        id: '44444444-4444-4444-4444-444444444443',
        clinic_id: '00000000-0000-0000-0000-000000000001',
        doctor_id: '11111111-1111-1111-1111-111111111112',
        doctor_name: 'Dr. Neha Kulkarni',
        doctor_specialty: 'Orthodontist & Clear Aligners',
        patient_id: '33333333-3333-3333-3333-333333333333',
        patient_name: 'Ananya Iyer',
        patient_phone: '+91 97312 34567',
        start_at: `${dayAfterStr}T15:00:00Z`,
        end_at: `${dayAfterStr}T15:30:00Z`,
        status: 'CONFIRMED',
        booking_source: 'AI_VOICE',
        sms_status: 'DELIVERED',
        whatsapp_status: 'DELIVERED',
        notes: 'Clear aligner progress check',
        created_at: new Date().toISOString(),
      },
      {
        id: '44444444-4444-4444-4444-444444444444',
        clinic_id: '00000000-0000-0000-0000-000000000002',
        doctor_id: '22222222-2222-2222-2222-222222222221',
        doctor_name: 'Dr. Sunita Rao',
        doctor_specialty: 'Cosmetic Dermatologist',
        patient_id: '33333333-3333-3333-3333-333333333334',
        patient_name: 'Kavita Reddy',
        patient_phone: '+91 99001 55443',
        start_at: `${tomorrowStr}T11:30:00Z`,
        end_at: `${tomorrowStr}T12:00:00Z`,
        status: 'CONFIRMED',
        booking_source: 'AI_VOICE',
        sms_status: 'DELIVERED',
        whatsapp_status: 'DELIVERED',
        notes: 'Consultation for acne scar laser',
        created_at: new Date().toISOString(),
      },
    ];

    // 7. FAQs
    this.faqs = [
      {
        id: 'faq-1',
        clinic_id: '00000000-0000-0000-0000-000000000001',
        category: 'CONSULTATION FEE',
        question: 'What is the consultation fee for dental doctors?',
        answer: 'General dental consultation is ₹500. Specialized root canal and orthodontic consultations with Dr. Verma or Dr. Kulkarni are ₹750 to ₹800.',
        created_at: new Date().toISOString(),
      },
      {
        id: 'faq-2',
        clinic_id: '00000000-0000-0000-0000-000000000001',
        category: 'EMERGENCY',
        question: 'What should I do in case of severe dental pain or emergency?',
        answer: 'For acute trauma or bleeding, please visit our Koramangala clinic directly or call our emergency hotline. For general severe pain, we can book an emergency same-day slot with Dr. Ashish Verma.',
        created_at: new Date().toISOString(),
      },
      {
        id: 'faq-3',
        clinic_id: '00000000-0000-0000-0000-000000000001',
        category: 'TIMINGS',
        question: 'What are the clinic opening and closing hours?',
        answer: 'We are open Monday to Friday from 9:30 AM to 7:30 PM, and Saturday from 10:00 AM to 4:00 PM. We are closed on Sundays.',
        created_at: new Date().toISOString(),
      },
      {
        id: 'faq-4',
        clinic_id: '00000000-0000-0000-0000-000000000001',
        category: 'PARKING',
        question: 'Is car and two-wheeler parking available at the clinic?',
        answer: 'Yes, dedicated basement parking for both cars and two-wheelers is available for all registered patients.',
        created_at: new Date().toISOString(),
      },
      {
        id: 'faq-5',
        clinic_id: '00000000-0000-0000-0000-000000000001',
        category: 'INSURANCE',
        question: 'Do you accept cashless health and dental insurance?',
        answer: 'We accept cashless claims from Star Health, HDFC ERGO, and Bajaj Allianz. For other providers, we provide detailed stamped itemized bills for reimbursement.',
        created_at: new Date().toISOString(),
      },
    ];

    // 8. Call Logs
    this.callLogs = [
      {
        id: 'call-1',
        clinic_id: '00000000-0000-0000-0000-000000000001',
        caller_phone: '+91 98450 12345',
        started_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        ended_at: new Date(Date.now() - 3600000 * 2 + 102000).toISOString(),
        duration_seconds: 102,
        call_intent: 'Book Appointment',
        outcome: 'BOOKED',
        appointment_id: '44444444-4444-4444-4444-444444444441',
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        dialogue_turns: [
          {
            turn_index: 0,
            speaker: 'ai',
            text: 'Namaste! Thank you for calling Apollo Dental Clinic. How can I assist you with your appointment or visit today?',
            timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
            latency_ms: 450,
          },
          {
            turn_index: 1,
            speaker: 'user',
            text: 'Hi, I need a root canal follow-up appointment with Dr. Ashish Verma tomorrow.',
            timestamp: new Date(Date.now() - 3600000 * 2 + 5000).toISOString(),
          },
          {
            turn_index: 2,
            speaker: 'ai',
            text: 'Certainly! Dr. Ashish Verma is available tomorrow at 11:00 AM. Shall I confirm that slot for you?',
            tool_called: 'check_availability',
            latency_ms: 580,
            timestamp: new Date(Date.now() - 3600000 * 2 + 7000).toISOString(),
          },
          {
            turn_index: 3,
            speaker: 'user',
            text: 'Yes please, my name is Priya Sundaram.',
            timestamp: new Date(Date.now() - 3600000 * 2 + 12000).toISOString(),
          },
          {
            turn_index: 4,
            speaker: 'ai',
            text: 'Your appointment with Dr. Ashish Verma is confirmed for tomorrow at 11:00 AM. We have dispatched confirmation details to your phone. Thank you!',
            tool_called: 'book_appointment',
            latency_ms: 610,
            timestamp: new Date(Date.now() - 3600000 * 2 + 15000).toISOString(),
          },
        ],
      },
      {
        id: 'call-2',
        clinic_id: '00000000-0000-0000-0000-000000000001',
        caller_phone: '+91 98765 43210',
        started_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        ended_at: new Date(Date.now() - 3600000 * 5 + 85000).toISOString(),
        duration_seconds: 85,
        call_intent: 'Consultation Fee Inquiry',
        outcome: 'FAQ_ANSWERED',
        created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        transcript_preview: 'Answered inquiry regarding dental specialist fees (₹500 - ₹800).',
        dialogue_turns: [
          {
            turn_index: 0,
            speaker: 'ai',
            text: 'Hello! Thank you for calling Apollo Dental Clinic. How can I assist you today?',
            timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
            latency_ms: 420,
          },
          {
            turn_index: 1,
            speaker: 'user',
            text: 'What is the consultation fee for dental specialist doctors?',
            timestamp: new Date(Date.now() - 3600000 * 5 + 4000).toISOString(),
          },
          {
            turn_index: 2,
            speaker: 'ai',
            text: 'Our general consultation fee is ₹500, while specialized endodontic and orthodontic consultations with Dr. Verma or Dr. Kulkarni are ₹750 to ₹800.',
            tool_called: 'get_clinic_information',
            latency_ms: 540,
            timestamp: new Date(Date.now() - 3600000 * 5 + 6000).toISOString(),
          },
        ],
      },
      {
        id: 'call-3',
        clinic_id: '00000000-0000-0000-0000-000000000001',
        caller_phone: '+91 98220 11223',
        started_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        ended_at: new Date(Date.now() - 3600000 * 24 + 45000).toISOString(),
        duration_seconds: 45,
        call_intent: 'Clinic Timings Inquiry',
        outcome: 'FAQ_ANSWERED',
        created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        transcript_preview: 'Caller verified Saturday working hours (10 AM to 4 PM).',
        dialogue_turns: [
          {
            turn_index: 0,
            speaker: 'ai',
            text: 'Hello! Welcome to Apollo Dental Clinic. How can I help you?',
            timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
            latency_ms: 410,
          },
          {
            turn_index: 1,
            speaker: 'user',
            text: 'Are you open on Saturdays?',
            timestamp: new Date(Date.now() - 3600000 * 24 + 3000).toISOString(),
          },
          {
            turn_index: 2,
            speaker: 'ai',
            text: 'Yes! We are open on Saturdays from 10:00 AM to 4:00 PM.',
            tool_called: 'get_clinic_information',
            latency_ms: 490,
            timestamp: new Date(Date.now() - 3600000 * 24 + 5000).toISOString(),
          },
        ],
      },
    ];

    // 9. Schema Tables 13 & 14: Conversations & Messages
    this.conversations = [
      {
        id: 'conv-1',
        call_id: 'call-1',
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 'conv-2',
        call_id: 'call-2',
        created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
      {
        id: 'conv-3',
        call_id: 'call-3',
        created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
    ];

    this.messages = [
      // conv-1 messages
      {
        id: 'msg-1-1',
        conversation_id: 'conv-1',
        speaker: 'RECEPTIONIST',
        content: 'Namaste! Thank you for calling Apollo Dental Clinic. How can I assist you with your appointment or visit today?',
        latency_ms: 450,
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 'msg-1-2',
        conversation_id: 'conv-1',
        speaker: 'PATIENT',
        content: 'Hi, I need a root canal follow-up appointment with Dr. Ashish Verma tomorrow.',
        timestamp: new Date(Date.now() - 3600000 * 2 + 5000).toISOString(),
      },
      {
        id: 'msg-1-3',
        conversation_id: 'conv-1',
        speaker: 'RECEPTIONIST',
        content: 'Certainly! Dr. Ashish Verma is available tomorrow at 11:00 AM. Shall I confirm that slot for you?',
        tool_called: 'check_availability',
        latency_ms: 580,
        timestamp: new Date(Date.now() - 3600000 * 2 + 7000).toISOString(),
      },
      {
        id: 'msg-1-4',
        conversation_id: 'conv-1',
        speaker: 'PATIENT',
        content: 'Yes please, my name is Priya Sundaram.',
        timestamp: new Date(Date.now() - 3600000 * 2 + 12000).toISOString(),
      },
      {
        id: 'msg-1-5',
        conversation_id: 'conv-1',
        speaker: 'RECEPTIONIST',
        content: 'Your appointment with Dr. Ashish Verma is confirmed for tomorrow at 11:00 AM. We have dispatched confirmation details to your phone. Thank you!',
        tool_called: 'book_appointment',
        latency_ms: 610,
        timestamp: new Date(Date.now() - 3600000 * 2 + 15000).toISOString(),
      },
      // conv-2 messages
      {
        id: 'msg-2-1',
        conversation_id: 'conv-2',
        speaker: 'RECEPTIONIST',
        content: 'Hello! Thank you for calling Apollo Dental Clinic. How can I assist you today?',
        latency_ms: 420,
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
      {
        id: 'msg-2-2',
        conversation_id: 'conv-2',
        speaker: 'PATIENT',
        content: 'What is the consultation fee for dental specialist doctors?',
        timestamp: new Date(Date.now() - 3600000 * 5 + 4000).toISOString(),
      },
      {
        id: 'msg-2-3',
        conversation_id: 'conv-2',
        speaker: 'RECEPTIONIST',
        content: 'Our general consultation fee is ₹500, while specialized endodontic and orthodontic consultations with Dr. Verma or Dr. Kulkarni are ₹750 to ₹800.',
        tool_called: 'get_clinic_information',
        latency_ms: 540,
        timestamp: new Date(Date.now() - 3600000 * 5 + 6000).toISOString(),
      },
      // conv-3 messages
      {
        id: 'msg-3-1',
        conversation_id: 'conv-3',
        speaker: 'RECEPTIONIST',
        content: 'Hello! Welcome to Apollo Dental Clinic. How can I help you?',
        latency_ms: 410,
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
      {
        id: 'msg-3-2',
        conversation_id: 'conv-3',
        speaker: 'PATIENT',
        content: 'Are you open on Saturdays?',
        timestamp: new Date(Date.now() - 3600000 * 24 + 3000).toISOString(),
      },
      {
        id: 'msg-3-3',
        conversation_id: 'conv-3',
        speaker: 'RECEPTIONIST',
        content: 'Yes! We are open on Saturdays from 10:00 AM to 4:00 PM.',
        tool_called: 'get_clinic_information',
        latency_ms: 490,
        timestamp: new Date(Date.now() - 3600000 * 24 + 5000).toISOString(),
      },
    ];
  }

  // Clinic Operations
  getClinics(): Clinic[] {
    return this.clinics;
  }

  getClinicById(id: string): Clinic | undefined {
    return this.clinics.find((c) => c.id === id);
  }

  getClinicByPhone(phone: string): Clinic | undefined {
    const cleaned = phone.replace(/[^0-9+]/g, '');
    return this.clinics.find((c) => {
      const cCleaned = c.phone_number.replace(/[^0-9+]/g, '');
      return cCleaned === cleaned || cleaned.endsWith(cCleaned.replace(/^\+91/, '')) || cCleaned.endsWith(cleaned.replace(/^\+91/, ''));
    }) || this.clinics[0];
  }

  createClinic(data: {
    name: string;
    address?: string;
    phone_number?: string;
    agent_name?: string;
    primary_language?: 'mr' | 'hi' | 'en';
    voice_id?: string;
    plan_tier?: 'starter' | 'growth' | 'enterprise';
    primary_handoff_number?: string;
    ai_greeting?: string;
  }): Clinic {
    const newId = `clinic-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const lang = data.primary_language || 'mr';
    const agentName = data.agent_name || (lang === 'mr' ? 'माया' : lang === 'hi' ? 'प्रिया' : 'Maya');

    let defaultGreeting = `नमस्कार! ${data.name} मध्ये आपले स्वागत आहे. मी ${agentName}, आपली काय मदत करू?`;
    if (lang === 'hi') {
      defaultGreeting = `नमस्ते! ${data.name} में आपका स्वागत है। मैं ${agentName}, आपकी क्या सहायता कर सकती हूँ?`;
    } else if (lang === 'en') {
      defaultGreeting = `Hello! Welcome to ${data.name}. My name is ${agentName}. How can I help you today?`;
    }

    const newClinic: Clinic = {
      id: newId,
      name: data.name,
      address: data.address || 'MG Road, Pune, Maharashtra - 411001',
      phone_number: data.phone_number || `+91-80-4567-${Math.floor(1000 + Math.random() * 9000)}`,
      timezone: 'Asia/Kolkata',
      agent_enabled: true,
      agent_name: agentName,
      primary_language: lang,
      voice_id: data.voice_id || (lang === 'mr' ? 'mr-IN-AarohiNeural' : lang === 'hi' ? 'hi-IN-SwaraNeural' : 'en-IN-NeerjaNeural'),
      plan_tier: data.plan_tier || 'growth',
      monthly_minutes_used: 0,
      monthly_minute_limit: data.plan_tier === 'enterprise' ? 2500 : data.plan_tier === 'starter' ? 500 : 1000,
      primary_handoff_number: data.primary_handoff_number || '+91-98765-00000',
      ai_greeting: data.ai_greeting || defaultGreeting,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.clinics.push(newClinic);

    // Auto-seed default settings
    this.settings.push({
      id: `set-${Date.now()}`,
      clinic_id: newId,
      operating_hours: {
        mon: '09:30-19:30',
        tue: '09:30-19:30',
        wed: '09:30-19:30',
        thu: '09:30-19:30',
        fri: '09:30-19:30',
        sat: '10:00-16:00',
        sun: 'closed',
      },
      ai_greeting: newClinic.ai_greeting || defaultGreeting,
      ai_enabled: true,
      agent_name: agentName,
      primary_language: lang,
      primary_handoff_number: newClinic.primary_handoff_number || '+91-98765-00000',
    });

    // Auto-seed sample doctor
    this.doctors.push({
      id: `doc-${Date.now()}`,
      clinic_id: newId,
      name: 'Dr. Sameer Patil',
      specialty: 'Chief Medical Specialist',
      description: 'Senior consulting specialist with 10+ years clinical experience.',
      consultation_duration_minutes: 30,
      consultation_fee: 600,
      is_active: true,
      created_at: new Date().toISOString(),
    });

    // Auto-seed sample FAQs
    this.faqs.push(
      {
        id: `faq-${Date.now()}-1`,
        clinic_id: newId,
        category: 'FEES',
        question: 'What is the consultation fee?',
        answer: `Our standard doctor consultation fee is ₹600.`,
        created_at: new Date().toISOString(),
      },
      {
        id: `faq-${Date.now()}-2`,
        clinic_id: newId,
        category: 'PARKING',
        question: 'Is parking available at the clinic?',
        answer: 'Yes, free dedicated parking is available for 2-wheelers and 4-wheelers.',
        created_at: new Date().toISOString(),
      }
    );

    return newClinic;
  }

  toggleAgent(clinicId: string, enabled: boolean): Clinic | undefined {
    const clinic = this.clinics.find((c) => c.id === clinicId);
    if (!clinic) return undefined;
    clinic.agent_enabled = enabled;
    clinic.updated_at = new Date().toISOString();

    const settings = this.settings.find((s) => s.clinic_id === clinicId);
    if (settings) {
      settings.ai_enabled = enabled;
    }
    return clinic;
  }

  deleteClinic(clinicId: string): boolean {
    const index = this.clinics.findIndex((c) => c.id === clinicId);
    if (index === -1) return false;
    this.clinics.splice(index, 1);
    this.settings = this.settings.filter((s) => s.clinic_id !== clinicId);
    this.doctors = this.doctors.filter((d) => d.clinic_id !== clinicId);
    this.faqs = this.faqs.filter((f) => f.clinic_id !== clinicId);
    this.appointments = this.appointments.filter((a) => a.clinic_id !== clinicId);
    this.callLogs = this.callLogs.filter((c) => c.clinic_id !== clinicId);
    return true;
  }

  getClinicsOverview() {
    return this.clinics.map((clinic) => {
      const doctors = this.doctors.filter((d) => d.clinic_id === clinic.id);
      const appointments = this.appointments.filter((a) => a.clinic_id === clinic.id);
      const calls = this.callLogs.filter((c) => c.clinic_id === clinic.id);
      return {
        ...clinic,
        doctors_count: doctors.length,
        appointments_count: appointments.length,
        calls_count: calls.length,
      };
    });
  }

  updateClinic(id: string, updates: Partial<Clinic>): Clinic | undefined {
    const clinic = this.clinics.find((c) => c.id === id);
    if (!clinic) return undefined;
    Object.assign(clinic, updates, { updated_at: new Date().toISOString() });
    
    // Sync to settings if ai_greeting or handoff changed
    const settings = this.settings.find((s) => s.clinic_id === id);
    if (settings) {
      if (updates.ai_greeting !== undefined) settings.ai_greeting = updates.ai_greeting;
      if (updates.agent_enabled !== undefined) settings.ai_enabled = updates.agent_enabled;
      if (updates.primary_handoff_number !== undefined) settings.primary_handoff_number = updates.primary_handoff_number;
    }
    return clinic;
  }

  getClinicSettings(clinicId: string): ClinicSettings | undefined {
    return this.settings.find((s) => s.clinic_id === clinicId);
  }

  updateClinicSettings(clinicId: string, updates: Partial<ClinicSettings>): ClinicSettings {
    let settings = this.settings.find((s) => s.clinic_id === clinicId);
    if (!settings) {
      settings = {
        id: `set-${Date.now()}`,
        clinic_id: clinicId,
        operating_hours: {
          mon: '09:30-19:30',
          tue: '09:30-19:30',
          wed: '09:30-19:30',
          thu: '09:30-19:30',
          fri: '09:30-19:30',
          sat: '10:00-16:00',
          sun: 'closed',
        },
        ai_greeting: 'Hello! Thank you for calling our clinic. How can I help you today?',
        ai_enabled: true,
        primary_handoff_number: '+91-98765-00001',
      };
      this.settings.push(settings);
    }
    Object.assign(settings, updates);
    return settings;
  }

  // Doctor Operations
  getDoctors(clinicId: string): Doctor[] {
    return this.doctors.filter((d) => d.clinic_id === clinicId && d.is_active);
  }

  getDoctorById(id: string): Doctor | undefined {
    return this.doctors.find((d) => d.id === id);
  }

  addDoctor(doctor: Omit<Doctor, 'id' | 'created_at'>): Doctor {
    const newDoc: Doctor = {
      ...doctor,
      id: `doc-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    this.doctors.push(newDoc);
    return newDoc;
  }

  updateDoctor(id: string, updates: Partial<Doctor>): Doctor | undefined {
    const doc = this.doctors.find((d) => d.id === id);
    if (!doc) return undefined;
    Object.assign(doc, updates);
    return doc;
  }

  // Availability & Scheduling
  getDoctorAvailability(doctorId: string): DoctorAvailability[] {
    return this.availability.filter((a) => a.doctor_id === doctorId);
  }

  getDoctorBreaks(doctorId: string): DoctorBreak[] {
    return this.breaks.filter((b) => b.doctor_id === doctorId);
  }

  getDoctorLeaves(doctorId: string): DoctorLeave[] {
    return this.leaves.filter((l) => l.doctor_id === doctorId);
  }

  getClinicHolidays(clinicId: string): ClinicHoliday[] {
    return this.holidays.filter((h) => h.clinic_id === clinicId);
  }

  // Appointments
  getAppointments(clinicId: string, filters?: { date?: string; doctorId?: string; status?: string }): Appointment[] {
    return this.appointments.filter((a) => {
      if (a.clinic_id !== clinicId) return false;
      if (filters?.doctorId && a.doctor_id !== filters.doctorId) return false;
      if (filters?.status && a.status !== filters.status) return false;
      if (filters?.date) {
        const appDate = a.start_at.split('T')[0];
        if (appDate !== filters.date) return false;
      }
      return true;
    });
  }

  getAppointmentById(id: string): Appointment | undefined {
    return this.appointments.find((a) => a.id === id);
  }

  bookAppointmentAtomic(payload: {
    clinic_id: string;
    doctor_id: string;
    patient_name: string;
    patient_phone: string;
    start_at: string;
    end_at: string;
    booking_source?: 'AI_VOICE' | 'MANUAL' | 'WEBRTC_DEMO';
    notes?: string;
  }): { success: boolean; appointment?: Appointment; error_code?: string; message: string } {
    // 1. Lock check: is slot already taken?
    const existing = this.appointments.find(
      (a) => a.doctor_id === payload.doctor_id && 
             a.start_at === payload.start_at && 
             a.status === 'CONFIRMED'
    );

    if (existing) {
      return {
        success: false,
        error_code: 'SLOT_ALREADY_BOOKED',
        message: 'This time slot has already been reserved by another patient.',
      };
    }

    // 2. Upsert patient
    let patient = this.patients.find(
      (p) => p.clinic_id === payload.clinic_id && p.phone === payload.patient_phone
    );
    if (!patient) {
      patient = {
        id: `pat-${Date.now()}`,
        clinic_id: payload.clinic_id,
        name: payload.patient_name,
        phone: payload.patient_phone,
        created_at: new Date().toISOString(),
      };
      this.patients.push(patient);
    } else {
      patient.name = payload.patient_name;
    }

    const doctor = this.getDoctorById(payload.doctor_id);

    // 3. Create appointment
    const newAppointment: Appointment = {
      id: `app-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      clinic_id: payload.clinic_id,
      doctor_id: payload.doctor_id,
      doctor_name: doctor?.name || 'Assigned Doctor',
      doctor_specialty: doctor?.specialty || 'Specialist',
      patient_id: patient.id,
      patient_name: payload.patient_name,
      patient_phone: payload.patient_phone,
      start_at: payload.start_at,
      end_at: payload.end_at,
      status: 'CONFIRMED',
      booking_source: payload.booking_source || 'AI_VOICE',
      sms_status: 'DELIVERED',
      whatsapp_status: 'DELIVERED',
      notes: payload.notes,
      created_at: new Date().toISOString(),
    };

    this.appointments.unshift(newAppointment);

    return {
      success: true,
      appointment: newAppointment,
      message: 'Appointment successfully confirmed.',
    };
  }

  updateAppointmentNotificationStatus(
    appointmentId: string,
    smsStatus: 'NOT_SENT' | 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED',
    whatsappStatus: 'NOT_SENT' | 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED',
    logs?: any[]
  ): Appointment | undefined {
    const app = this.appointments.find((a) => a.id === appointmentId);
    if (!app) return undefined;
    app.sms_status = smsStatus;
    app.whatsapp_status = whatsappStatus;
    app.last_notified_at = new Date().toISOString();
    if (logs) {
      app.notification_logs = [...(app.notification_logs || []), ...logs];
    }
    return app;
  }

  cancelAppointment(appointmentId: string, reason: string = 'Cancelled via AI'): { success: boolean; message: string } {
    const app = this.appointments.find((a) => a.id === appointmentId);
    if (!app || app.status === 'CANCELLED') {
      return {
        success: false,
        message: 'Appointment not found or already cancelled.',
      };
    }
    app.status = 'CANCELLED';
    app.cancelled_at = new Date().toISOString();
    app.cancellation_reason = reason;
    return {
      success: true,
      message: 'Appointment has been successfully cancelled.',
    };
  }

  rescheduleAppointment(
    appointmentId: string,
    newStartAt: string,
    newEndAt: string
  ): { success: boolean; appointment?: Appointment; error_code?: string; message: string } {
    const app = this.appointments.find((a) => a.id === appointmentId && a.status === 'CONFIRMED');
    if (!app) {
      return {
        success: false,
        error_code: 'APPOINTMENT_NOT_FOUND',
        message: 'Original confirmed appointment was not found.',
      };
    }

    // Check collision on new slot
    const collision = this.appointments.find(
      (a) => a.doctor_id === app.doctor_id && 
             a.start_at === newStartAt && 
             a.status === 'CONFIRMED' && 
             a.id !== appointmentId
    );

    if (collision) {
      return {
        success: false,
        error_code: 'SLOT_ALREADY_BOOKED',
        message: 'The target new slot is already booked.',
      };
    }

    app.start_at = newStartAt;
    app.end_at = newEndAt;
    app.notes = (app.notes ? app.notes + ' ' : '') + `(Rescheduled to ${newStartAt})`;

    return {
      success: true,
      appointment: app,
      message: 'Appointment has been rescheduled successfully.',
    };
  }

  // Patients
  getPatients(clinicId: string, query?: string): Patient[] {
    return this.patients.filter((p) => {
      if (p.clinic_id !== clinicId) return false;
      if (query) {
        const q = query.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.phone.includes(q);
      }
      return true;
    });
  }

  // Call Logs & Recording
  getCallLogs(clinicId: string): CallLog[] {
    return this.callLogs.filter((c) => c.clinic_id === clinicId);
  }

  getCallLogById(id: string): CallLog | undefined {
    return this.callLogs.find((c) => c.id === id);
  }

  getCallLogBySid(sid: string): CallLog | undefined {
    return this.callLogs.find((c) => (c as any).call_sid === sid || c.id === sid);
  }

  logCall(call: Omit<CallLog, 'id' | 'created_at' | 'started_at'> & { id?: string; started_at?: string; call_sid?: string }): CallLog {
    const callId = call.id || (call as any).call_sid || `call-${Date.now()}`;
    const newLog: CallLog = {
      started_at: call.started_at || new Date().toISOString(),
      ...call,
      id: callId,
      created_at: new Date().toISOString(),
    };
    this.callLogs.unshift(newLog);

    // Schema Table 13: Automatically create Conversation record
    let conv = this.conversations.find((c) => c.call_id === callId);
    if (!conv) {
      conv = {
        id: `conv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        call_id: callId,
        created_at: newLog.started_at,
      };
      this.conversations.unshift(conv);
    }

    return newLog;
  }

  updateCallLog(idOrSid: string, updates: Partial<CallLog>): CallLog | undefined {
    const log = this.callLogs.find((c) => c.id === idOrSid || (c as any).call_sid === idOrSid);
    if (!log) return undefined;
    Object.assign(log, updates);
    return log;
  }

  addDialogueTurn(idOrSid: string, turn: Omit<DialogueTurn, 'turn_index'>): CallLog | undefined {
    const log = this.callLogs.find((c) => c.id === idOrSid || (c as any).call_sid === idOrSid);
    if (!log) return undefined;
    if (!log.dialogue_turns) log.dialogue_turns = [];
    const newTurn: DialogueTurn = { ...turn, turn_index: log.dialogue_turns.length };
    log.dialogue_turns.push(newTurn);
    // Accumulate total AI latency
    if (turn.speaker === 'ai' && turn.latency_ms) {
      log.total_latency_ms = (log.total_latency_ms || 0) + turn.latency_ms;
    }
    // Track detected language (last AI turn wins)
    if (turn.language) {
      log.detected_language = turn.language;
    }

    // Schema Tables 13 & 14: Mirror to conversation and messages
    let conv = this.conversations.find((c) => c.call_id === log.id);
    if (!conv) {
      conv = {
        id: `conv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        call_id: log.id,
        created_at: log.started_at,
      };
      this.conversations.unshift(conv);
    }

    const speakerMapped: 'PATIENT' | 'RECEPTIONIST' | 'SYSTEM' = 
      turn.speaker === 'ai' ? 'RECEPTIONIST' : 'PATIENT';

    this.messages.push({
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      conversation_id: conv.id,
      speaker: speakerMapped,
      content: turn.text,
      latency_ms: turn.latency_ms,
      tool_called: turn.tool_called,
      timestamp: turn.timestamp || new Date().toISOString(),
    });

    return log;
  }

  // ─── Schema Tables 13 & 14: Conversations & Messages ─────────────
  private ensureConversationsInitialized() {
    if (!this.conversations || this.conversations.length === 0) {
      this.conversations = [
        {
          id: 'conv-1',
          call_id: 'call-1',
          created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        },
        {
          id: 'conv-2',
          call_id: 'call-2',
          created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        },
        {
          id: 'conv-3',
          call_id: 'call-3',
          created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        },
      ];
    }
    if (!this.messages || this.messages.length === 0) {
      this.messages = [
        {
          id: 'msg-1-1',
          conversation_id: 'conv-1',
          speaker: 'RECEPTIONIST',
          content: 'Namaste! Thank you for calling Apollo Dental Clinic. How can I assist you with your appointment or visit today?',
          latency_ms: 450,
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        },
        {
          id: 'msg-1-2',
          conversation_id: 'conv-1',
          speaker: 'PATIENT',
          content: 'Hi, I need a root canal follow-up appointment with Dr. Ashish Verma tomorrow.',
          timestamp: new Date(Date.now() - 3600000 * 2 + 5000).toISOString(),
        },
        {
          id: 'msg-1-3',
          conversation_id: 'conv-1',
          speaker: 'RECEPTIONIST',
          content: 'Certainly! Dr. Ashish Verma is available tomorrow at 11:00 AM. Shall I confirm that slot for you?',
          tool_called: 'check_availability',
          latency_ms: 580,
          timestamp: new Date(Date.now() - 3600000 * 2 + 7000).toISOString(),
        },
        {
          id: 'msg-1-4',
          conversation_id: 'conv-1',
          speaker: 'PATIENT',
          content: 'Yes please, my name is Priya Sundaram.',
          timestamp: new Date(Date.now() - 3600000 * 2 + 12000).toISOString(),
        },
        {
          id: 'msg-1-5',
          conversation_id: 'conv-1',
          speaker: 'RECEPTIONIST',
          content: 'Your appointment with Dr. Ashish Verma is confirmed for tomorrow at 11:00 AM. We have dispatched confirmation details to your phone. Thank you!',
          tool_called: 'book_appointment',
          latency_ms: 610,
          timestamp: new Date(Date.now() - 3600000 * 2 + 15000).toISOString(),
        },
        {
          id: 'msg-2-1',
          conversation_id: 'conv-2',
          speaker: 'RECEPTIONIST',
          content: 'Hello! Thank you for calling Apollo Dental Clinic. How can I assist you today?',
          latency_ms: 420,
          timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
        },
        {
          id: 'msg-2-2',
          conversation_id: 'conv-2',
          speaker: 'PATIENT',
          content: 'What is the consultation fee for dental specialist doctors?',
          timestamp: new Date(Date.now() - 3600000 * 5 + 4000).toISOString(),
        },
        {
          id: 'msg-2-3',
          conversation_id: 'conv-2',
          speaker: 'RECEPTIONIST',
          content: 'Our general consultation fee is ₹500, while specialized endodontic and orthodontic consultations with Dr. Verma or Dr. Kulkarni are ₹750 to ₹800.',
          tool_called: 'get_clinic_information',
          latency_ms: 540,
          timestamp: new Date(Date.now() - 3600000 * 5 + 6000).toISOString(),
        },
        {
          id: 'msg-3-1',
          conversation_id: 'conv-3',
          speaker: 'RECEPTIONIST',
          content: 'Hello! Welcome to Apollo Dental Clinic. How can I help you?',
          latency_ms: 410,
          timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
        },
        {
          id: 'msg-3-2',
          conversation_id: 'conv-3',
          speaker: 'PATIENT',
          content: 'Are you open on Saturdays?',
          timestamp: new Date(Date.now() - 3600000 * 24 + 3000).toISOString(),
        },
        {
          id: 'msg-3-3',
          conversation_id: 'conv-3',
          speaker: 'RECEPTIONIST',
          content: 'Yes! We are open on Saturdays from 10:00 AM to 4:00 PM.',
          tool_called: 'get_clinic_information',
          latency_ms: 490,
          timestamp: new Date(Date.now() - 3600000 * 24 + 5000).toISOString(),
        },
      ];
    }
  }

  getConversations(clinicId?: string): Conversation[] {
    this.ensureConversationsInitialized();
    if (clinicId) {
      const clinicCallIds = new Set(this.callLogs.filter((c) => c.clinic_id === clinicId).map((c) => c.id));
      return this.conversations.filter((conv) => clinicCallIds.has(conv.call_id));
    }
    return this.conversations;
  }

  getConversationById(id: string): Conversation | undefined {
    this.ensureConversationsInitialized();
    const conv = this.conversations.find((c) => c.id === id);
    if (!conv) return undefined;
    return {
      ...conv,
      messages: this.getMessages(conv.id),
    };
  }

  getConversationByCallId(callId: string): Conversation | undefined {
    this.ensureConversationsInitialized();
    const conv = this.conversations.find((c) => c.call_id === callId);
    if (!conv) return undefined;
    return {
      ...conv,
      messages: this.getMessages(conv.id),
    };
  }

  getMessages(conversationId?: string): Message[] {
    this.ensureConversationsInitialized();
    if (conversationId) {
      return this.messages.filter((m) => m.conversation_id === conversationId);
    }
    return this.messages;
  }

  createConversation(callId: string): Conversation {
    this.ensureConversationsInitialized();
    const existing = this.conversations.find((c) => c.call_id === callId);
    if (existing) return existing;
    const newConv: Conversation = {
      id: `conv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      call_id: callId,
      created_at: new Date().toISOString(),
    };
    this.conversations.unshift(newConv);
    return newConv;
  }

  addMessage(
    conversationId: string,
    speaker: 'PATIENT' | 'RECEPTIONIST' | 'SYSTEM',
    content: string,
    extra?: { latency_ms?: number; tool_called?: string; tool_result?: unknown; timestamp?: string }
  ): Message {
    this.ensureConversationsInitialized();
    const newMsg: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      conversation_id: conversationId,
      speaker,
      content,
      timestamp: extra?.timestamp || new Date().toISOString(),
      latency_ms: extra?.latency_ms,
      tool_called: extra?.tool_called,
      tool_result: extra?.tool_result,
    };
    this.messages.push(newMsg);
    return newMsg;
  }

  getConversationWithMessages(callIdOrConvId: string): { conversation: Conversation; messages: Message[] } | null {
    this.ensureConversationsInitialized();
    const conv = this.conversations.find(
      (c) => c.id === callIdOrConvId || c.call_id === callIdOrConvId
    );
    if (!conv) return null;
    const msgs = this.getMessages(conv.id);
    return {
      conversation: { ...conv, messages: msgs },
      messages: msgs,
    };
  }


  getClinicFAQs(clinicId: string, category?: string): ClinicFAQ[] {
    return this.faqs.filter((f) => {
      if (f.clinic_id !== clinicId) return false;
      if (category && f.category.toLowerCase() !== category.toLowerCase()) return false;
      return true;
    });
  }

  addFAQ(faq: Omit<ClinicFAQ, 'id' | 'created_at'>): ClinicFAQ {
    const newFaq: ClinicFAQ = {
      ...faq,
      id: `faq-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    this.faqs.push(newFaq);
    return newFaq;
  }

  deleteFAQ(id: string): boolean {
    const initialLen = this.faqs.length;
    this.faqs = this.faqs.filter((f) => f.id !== id);
    return this.faqs.length < initialLen;
  }

  // Stats Calculator
  getStats(clinicId: string): ClinicStats {
    const clinicAppointments = this.appointments.filter((a) => a.clinic_id === clinicId && a.status === 'CONFIRMED');
    const clinicCalls = this.callLogs.filter((c) => c.clinic_id === clinicId);
    const bookedCalls = clinicCalls.filter((c) => c.outcome === 'BOOKED').length;
    const rate = clinicCalls.length > 0 ? (bookedCalls / clinicCalls.length) * 100 : 33.3;

    // Calculate total minutes
    const totalSecs = clinicCalls.reduce((acc, c) => acc + c.duration_seconds, 0);
    const totalMins = totalSecs / 60;
    const directCogs = Number((totalMins * 3.23).toFixed(2)); // ₹3.23 / min

    // Calculate estimated consultation fees
    const estRevenue = clinicAppointments.reduce((acc, app) => {
      const doc = this.getDoctorById(app.doctor_id);
      return acc + (doc?.consultation_fee || 500);
    }, 0);

    return {
      appointments_count: clinicAppointments.length,
      total_calls_count: clinicCalls.length,
      booking_rate_percentage: Number(rate.toFixed(1)),
      avg_turn_latency_ms: 579,
      direct_cogs_inr: directCogs || 11.63,
      est_revenue_inr: estRevenue || 1950,
    };
  }
}

// Global Singleton for Local Store
const globalForStore = globalThis as unknown as { localStore?: LocalStore };
if (globalForStore.localStore) {
  Object.setPrototypeOf(globalForStore.localStore, LocalStore.prototype);
}
export const localStore = globalForStore.localStore || new LocalStore();
if (process.env.NODE_ENV !== 'production') globalForStore.localStore = localStore;
