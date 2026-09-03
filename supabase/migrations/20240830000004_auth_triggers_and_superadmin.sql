-- Migration: Auth Triggers, Super Admin RLS Bypass, and Clinic Recording Policy
-- Description: Adds auth.users synchronization trigger, is_super_admin() bypass helper, and recording_policy column

-- 1. Add recording_policy to clinic_settings
ALTER TABLE clinic_settings 
ADD COLUMN IF NOT EXISTS recording_policy TEXT CHECK (recording_policy IN ('ALWAYS', 'CONSENT_REQUIRED', 'DISABLED')) DEFAULT 'CONSENT_REQUIRED';

-- 2. Helper function to check if current authenticated user is a SUPER_ADMIN
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 3. Super Admin RLS Bypass Policies across all 14 tables
CREATE POLICY "Super Admins have full access to clinics" ON clinics
    FOR ALL TO authenticated
    USING (is_super_admin());

CREATE POLICY "Super Admins have full access to clinic_settings" ON clinic_settings
    FOR ALL TO authenticated
    USING (is_super_admin());

CREATE POLICY "Super Admins have full access to profiles" ON profiles
    FOR ALL TO authenticated
    USING (is_super_admin());

CREATE POLICY "Super Admins have full access to doctors" ON doctors
    FOR ALL TO authenticated
    USING (is_super_admin());

CREATE POLICY "Super Admins have full access to doctor_availability" ON doctor_availability
    FOR ALL TO authenticated
    USING (is_super_admin());

CREATE POLICY "Super Admins have full access to doctor_breaks" ON doctor_breaks
    FOR ALL TO authenticated
    USING (is_super_admin());

CREATE POLICY "Super Admins have full access to doctor_leaves" ON doctor_leaves
    FOR ALL TO authenticated
    USING (is_super_admin());

CREATE POLICY "Super Admins have full access to clinic_holidays" ON clinic_holidays
    FOR ALL TO authenticated
    USING (is_super_admin());

CREATE POLICY "Super Admins have full access to services" ON services
    FOR ALL TO authenticated
    USING (is_super_admin());

CREATE POLICY "Super Admins have full access to patients" ON patients
    FOR ALL TO authenticated
    USING (is_super_admin());

CREATE POLICY "Super Admins have full access to appointments" ON appointments
    FOR ALL TO authenticated
    USING (is_super_admin());

CREATE POLICY "Super Admins have full access to call_logs" ON call_logs
    FOR ALL TO authenticated
    USING (is_super_admin());

CREATE POLICY "Super Admins have full access to conversations" ON conversations
    FOR ALL TO authenticated
    USING (is_super_admin());

CREATE POLICY "Super Admins have full access to messages" ON messages
    FOR ALL TO authenticated
    USING (is_super_admin());

CREATE POLICY "Super Admins have full access to clinic_faqs" ON clinic_faqs
    FOR ALL TO authenticated
    USING (is_super_admin());

-- 4. Automatic User Synchronization Trigger
-- When a user signs up via Supabase Auth, synchronize their user record to public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    v_clinic_id UUID;
    v_role user_role;
    v_full_name TEXT;
BEGIN
    -- Extract clinic_id from raw user metadata or default to first clinic
    v_clinic_id := COALESCE(
        (new.raw_user_meta_data->>'clinic_id')::UUID,
        '00000000-0000-0000-0000-000000000001'::UUID
    );

    -- Extract role from metadata, default to CLINIC_ADMIN
    v_role := COALESCE(
        (new.raw_user_meta_data->>'role')::user_role,
        'CLINIC_ADMIN'::user_role
    );

    v_full_name := COALESCE(
        new.raw_user_meta_data->>'full_name',
        new.email,
        'Clinic User'
    );

    INSERT INTO public.profiles (id, clinic_id, full_name, role, email)
    VALUES (new.id, v_clinic_id, v_full_name, v_role, new.email)
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        email = EXCLUDED.email;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to allow idempotency
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Bind trigger to auth.users after insert
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
