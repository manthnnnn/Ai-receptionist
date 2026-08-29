-- Seed Data for Clinic 1: Apollo Dental Clinic & Clinic 2: Radiance Dermatology

-- 1. Insert Clinics
INSERT INTO clinics (id, name, address, phone_number, timezone) VALUES
('00000000-0000-0000-0000-000000000001', 'Apollo Dental Clinic', '45, 2nd Cross, Koramangala 4th Block, Bangalore - 560034', '+91-80-4567-8901', 'Asia/Kolkata'),
('00000000-0000-0000-0000-000000000002', 'Radiance Dermatology & Laser Center', '12, Indiranagar 100ft Road, Bangalore - 560038', '+91-80-4567-8902', 'Asia/Kolkata');

-- 2. Insert Clinic Settings
INSERT INTO clinic_settings (clinic_id, operating_hours, ai_greeting, primary_handoff_number) VALUES
('00000000-0000-0000-0000-000000000001', 
 '{"mon":"09:30-19:30","tue":"09:30-19:30","wed":"09:30-19:30","thu":"09:30-19:30","fri":"09:30-19:30","sat":"10:00-16:00","sun":"closed"}'::jsonb,
 'Hello! Thank you for calling Apollo Dental Clinic. How can I help you today?',
 '+91-98765-00001'),
('00000000-0000-0000-0000-000000000002', 
 '{"mon":"10:00-19:00","tue":"10:00-19:00","wed":"10:00-19:00","thu":"10:00-19:00","fri":"10:00-19:00","sat":"10:00-15:00","sun":"closed"}'::jsonb,
 'Welcome to Radiance Dermatology & Laser Center. How may I assist you?',
 '+91-98765-00002');

-- 3. Insert Doctors for Apollo Dental Clinic
INSERT INTO doctors (id, clinic_id, name, specialty, description, consultation_duration_minutes, consultation_fee) VALUES
('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'Dr. Ashish Verma', 'Endodontist & Root Canal Specialist', 'BDS, MDS (Endodontics - Manipal) with 12+ years experience in painless root canal treatments and microscopic dentistry.', 30, 750.00),
('11111111-1111-1111-1111-111111111112', '00000000-0000-0000-0000-000000000001', 'Dr. Neha Kulkarni', 'Orthodontist & Clear Aligners', 'BDS, MDS (Orthodontics - AIIMS). Certified Invisalign Diamond Provider specializing in smile design and braces.', 30, 800.00),
('11111111-1111-1111-1111-111111111113', '00000000-0000-0000-0000-000000000001', 'Dr. Rohan Mehta', 'General Dentist & Implantologist', 'BDS, Fellowship in Implantology. Expert in preventative dentistry, cleanings, and surgical dental implants.', 30, 500.00);

-- Insert Doctors for Radiance Dermatology
INSERT INTO doctors (id, clinic_id, name, specialty, description, consultation_duration_minutes, consultation_fee) VALUES
('22222222-2222-2222-2222-222222222221', '00000000-0000-0000-0000-000000000002', 'Dr. Sunita Rao', 'Cosmetic Dermatologist', 'MD (Dermatology). Specialist in anti-aging treatments, chemical peels, and acne therapies.', 30, 1000.00),
('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000002', 'Dr. Vikram Patel', 'Laser Specialist', 'MD, DVD (Skin). Expert in advanced laser scar removal, tattoo removal, and pigmentation.', 30, 900.00);

-- 4. Insert Weekly Availability for Dr. Ashish Verma (Mon-Fri 10:00-19:00, Sat 10:00-14:00)
INSERT INTO doctor_availability (doctor_id, weekday, start_time, end_time) VALUES
('11111111-1111-1111-1111-111111111111', 1, '10:00', '19:00'),
('11111111-1111-1111-1111-111111111111', 2, '10:00', '19:00'),
('11111111-1111-1111-1111-111111111111', 3, '10:00', '19:00'),
('11111111-1111-1111-1111-111111111111', 4, '10:00', '19:00'),
('11111111-1111-1111-1111-111111111111', 5, '10:00', '19:00'),
('11111111-1111-1111-1111-111111111111', 6, '10:00', '14:00');

-- Doctor Breaks (13:00-14:00 daily lunch)
INSERT INTO doctor_breaks (doctor_id, weekday, start_time, end_time) VALUES
('11111111-1111-1111-1111-111111111111', 1, '13:00', '14:00'),
('11111111-1111-1111-1111-111111111111', 2, '13:00', '14:00'),
('11111111-1111-1111-1111-111111111111', 3, '13:00', '14:00'),
('11111111-1111-1111-1111-111111111111', 4, '13:00', '14:00'),
('11111111-1111-1111-1111-111111111111', 5, '13:00', '14:00');

-- Availability for Dr. Neha Kulkarni & Dr. Rohan Mehta
INSERT INTO doctor_availability (doctor_id, weekday, start_time, end_time) VALUES
('11111111-1111-1111-1111-111111111112', 1, '10:00', '18:00'),
('11111111-1111-1111-1111-111111111112', 3, '10:00', '18:00'),
('11111111-1111-1111-1111-111111111112', 5, '10:00', '18:00'),
('11111111-1111-1111-1111-111111111113', 2, '10:00', '19:00'),
('11111111-1111-1111-1111-111111111113', 4, '10:00', '19:00'),
('11111111-1111-1111-1111-111111111113', 6, '10:00', '16:00');

-- 5. Insert Services for Apollo Dental
INSERT INTO services (clinic_id, name, description, duration_minutes, price) VALUES
('00000000-0000-0000-0000-000000000001', 'General Dental Consultation', 'Comprehensive dental examination and digital X-rays', 30, 500.00),
('00000000-0000-0000-0000-000000000001', 'Root Canal Treatment Consultation', 'Specialist assessment for infected pulp & microscopic RCT', 30, 750.00),
('00000000-0000-0000-0000-000000000001', 'Orthodontic & Braces Evaluation', '3D digital scan and alignment treatment plan', 30, 800.00),
('00000000-0000-0000-0000-000000000001', 'Teeth Cleaning & Scaling', 'Ultrasonic tartar removal and enamel polishing', 45, 1200.00);

-- 6. Insert Sample Patients
INSERT INTO patients (id, clinic_id, name, phone, email) VALUES
('33333333-3333-3333-3333-333333333331', '00000000-0000-0000-0000-000000000001', 'Priya Sundaram', '+91 98450 12345', 'priya.s@example.com'),
('33333333-3333-3333-3333-333333333332', '00000000-0000-0000-0000-000000000001', 'Rahul Sharma', '+91 98765 43210', 'rahul.sharma@example.com'),
('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', 'Ananya Iyer', '+91 97312 34567', 'ananya.iyer@example.com'),
('33333333-3333-3333-3333-333333333334', '00000000-0000-0000-0000-000000000002', 'Kavita Reddy', '+91 99001 55443', 'kavita.reddy@example.com');

-- 7. Insert Sample Confirmed Appointments (matching prototype)
INSERT INTO appointments (id, clinic_id, doctor_id, patient_id, patient_name, patient_phone, start_at, end_at, status, booking_source, notes) VALUES
('44444444-4444-4444-4444-444444444441', '00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'Priya Sundaram', '+91 98450 12345', NOW() + INTERVAL '1 day' + INTERVAL '11 hours', NOW() + INTERVAL '1 day' + INTERVAL '11 hours 30 mins', 'CONFIRMED', 'AI_VOICE', 'Follow-up root canal crown measurement'),
('44444444-4444-4444-4444-444444444442', '00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333332', 'Rahul Sharma', '+91 98765 43210', NOW() + INTERVAL '1 day' + INTERVAL '16 hours 30 mins', NOW() + INTERVAL '1 day' + INTERVAL '17 hours', 'CONFIRMED', 'AI_VOICE', 'Patient complained of mild molar sensitivity'),
('44444444-4444-4444-4444-444444444443', '00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111112', '33333333-3333-3333-3333-333333333333', 'Ananya Iyer', '+91 97312 34567', NOW() + INTERVAL '2 days' + INTERVAL '15 hours', NOW() + INTERVAL '2 days' + INTERVAL '15 hours 30 mins', 'CONFIRMED', 'AI_VOICE', 'Clear aligner progress check'),
('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222221', '33333333-3333-3333-3333-333333333334', 'Kavita Reddy', '+91 99001 55443', NOW() + INTERVAL '1 day' + INTERVAL '11 hours 30 mins', NOW() + INTERVAL '1 day' + INTERVAL '12 hours', 'CONFIRMED', 'AI_VOICE', 'Consultation for acne scar laser');

-- 8. Insert Clinic FAQs (matching prototype)
INSERT INTO clinic_faqs (clinic_id, category, question, answer) VALUES
('00000000-0000-0000-0000-000000000001', 'CONSULTATION FEE', 'What is the consultation fee for dental doctors?', 'General dental consultation with Dr. Rohan Mehta is ₹500. Specialized root canal and orthodontic consultations with Dr. Verma or Dr. Kulkarni are ₹750 to ₹800.'),
('00000000-0000-0000-0000-000000000001', 'EMERGENCY', 'What should I do in case of severe dental pain or emergency?', 'For acute trauma or bleeding, please visit our Koramangala clinic directly or call our emergency hotline. For general severe pain, we can book an emergency same-day slot with Dr. Ashish Verma.'),
('00000000-0000-0000-0000-000000000001', 'TIMINGS', 'What are the clinic opening and closing hours?', 'We are open Monday to Friday from 9:30 AM to 7:30 PM, and Saturday from 10:00 AM to 4:00 PM. We are closed on Sundays.'),
('00000000-0000-0000-0000-000000000001', 'PARKING', 'Is car and two-wheeler parking available at the clinic?', 'Yes, dedicated basement parking for both cars and two-wheelers is available for all registered patients.'),
('00000000-0000-0000-0000-000000000001', 'INSURANCE', 'Do you accept cashless health and dental insurance?', 'We accept cashless claims from Star Health, HDFC ERGO, and Bajaj Allianz. For other providers, we provide detailed stamped itemized bills for reimbursement.');

-- 9. Insert Sample Call Logs with Transcripts
INSERT INTO call_logs (id, clinic_id, caller_phone, duration_seconds, call_intent, outcome, created_at) VALUES
('55555555-5555-5555-5555-555555555551', '00000000-0000-0000-0000-000000000001', '+91 98450 12345', 102, 'Book Appointment', 'BOOKED', NOW() - INTERVAL '2 hours'),
('55555555-5555-5555-5555-555555555552', '00000000-0000-0000-0000-000000000001', '+91 98765 43210', 85, 'Consultation Fee Inquiry', 'FAQ_ANSWERED', NOW() - INTERVAL '4 hours'),
('55555555-5555-5555-5555-555555555553', '00000000-0000-0000-0000-000000000001', '+91 98220 11223', 45, 'Clinic Timings Inquiry', 'FAQ_ANSWERED', NOW() - INTERVAL '1 day');
