-- Enable Row Level Security (RLS) across all multi-tenant tables
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_breaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_faqs ENABLE ROW LEVEL SECURITY;

-- Helper Function: Get authenticated user's clinic ID
CREATE OR REPLACE FUNCTION get_user_clinic_id()
RETURNS UUID AS $$
    SELECT clinic_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 1. Profiles isolation
CREATE POLICY "Users can view profiles in their clinic" ON profiles
    FOR SELECT TO authenticated
    USING (clinic_id = get_user_clinic_id());

CREATE POLICY "Clinic Admins can manage profiles" ON profiles
    FOR ALL TO authenticated
    USING (clinic_id = get_user_clinic_id());

-- 2. Clinics isolation
CREATE POLICY "Users can view their own clinic" ON clinics
    FOR SELECT TO authenticated
    USING (id = get_user_clinic_id());

CREATE POLICY "Clinic Admins can update their clinic" ON clinics
    FOR UPDATE TO authenticated
    USING (id = get_user_clinic_id());

-- 3. Clinic Settings isolation
CREATE POLICY "Users can view clinic settings" ON clinic_settings
    FOR SELECT TO authenticated
    USING (clinic_id = get_user_clinic_id());

CREATE POLICY "Admins can manage clinic settings" ON clinic_settings
    FOR ALL TO authenticated
    USING (clinic_id = get_user_clinic_id());

-- 4. Doctors isolation
CREATE POLICY "Users can view doctors in clinic" ON doctors
    FOR SELECT TO authenticated
    USING (clinic_id = get_user_clinic_id());

CREATE POLICY "Staff can manage doctors in clinic" ON doctors
    FOR ALL TO authenticated
    USING (clinic_id = get_user_clinic_id());

-- 5. Doctor Availability & Exceptions
CREATE POLICY "Users can view doctor availability" ON doctor_availability
    FOR ALL TO authenticated
    USING (doctor_id IN (SELECT id FROM doctors WHERE clinic_id = get_user_clinic_id()));

CREATE POLICY "Users can view doctor breaks" ON doctor_breaks
    FOR ALL TO authenticated
    USING (doctor_id IN (SELECT id FROM doctors WHERE clinic_id = get_user_clinic_id()));

CREATE POLICY "Users can view doctor leaves" ON doctor_leaves
    FOR ALL TO authenticated
    USING (doctor_id IN (SELECT id FROM doctors WHERE clinic_id = get_user_clinic_id()));

CREATE POLICY "Users can view clinic holidays" ON clinic_holidays
    FOR ALL TO authenticated
    USING (clinic_id = get_user_clinic_id());

-- 6. Services & Patients isolation
CREATE POLICY "Users can view services in clinic" ON services
    FOR ALL TO authenticated
    USING (clinic_id = get_user_clinic_id());

CREATE POLICY "Users can view patients in clinic" ON patients
    FOR ALL TO authenticated
    USING (clinic_id = get_user_clinic_id());

-- 7. Appointments isolation
CREATE POLICY "Staff can view appointments in clinic" ON appointments
    FOR SELECT TO authenticated
    USING (clinic_id = get_user_clinic_id());

CREATE POLICY "Staff can manage appointments in clinic" ON appointments
    FOR ALL TO authenticated
    USING (clinic_id = get_user_clinic_id());

-- 8. Calls & Messages isolation
CREATE POLICY "Staff can view call logs in clinic" ON call_logs
    FOR ALL TO authenticated
    USING (clinic_id = get_user_clinic_id());

CREATE POLICY "Staff can view conversations in clinic" ON conversations
    FOR ALL TO authenticated
    USING (call_id IN (SELECT id FROM call_logs WHERE clinic_id = get_user_clinic_id()));

CREATE POLICY "Staff can view messages in clinic" ON messages
    FOR ALL TO authenticated
    USING (conversation_id IN (
        SELECT id FROM conversations WHERE call_id IN (
            SELECT id FROM call_logs WHERE clinic_id = get_user_clinic_id()
        )
    ));

-- 9. FAQs isolation
CREATE POLICY "Staff can manage FAQs in clinic" ON clinic_faqs
    FOR ALL TO authenticated
    USING (clinic_id = get_user_clinic_id());
