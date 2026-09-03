-- Migration: Audio Recording Storage Bucket and Access Policies
-- Description: Sets up private 'call-recordings' bucket and RLS policies for tenant-scoped recording access

-- 1. Create private storage bucket 'call-recordings' if it doesn't already exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'call-recordings',
    'call-recordings',
    false,
    52428800, -- 50 MB limit
    ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/webm']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/webm'];

-- 2. Storage RLS Policies
-- Allow authenticated staff to view recordings matching their clinic_id prefix
CREATE POLICY "Clinic staff can read own clinic recordings"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'call-recordings' AND (
        (storage.foldername(name))[1] = (SELECT clinic_id::text FROM public.profiles WHERE id = auth.uid())
        OR
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'SUPER_ADMIN'
    )
);

-- Allow backend service role / authenticated clinic admins to insert recordings
CREATE POLICY "Clinic staff can upload own clinic recordings"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'call-recordings' AND (
        (storage.foldername(name))[1] = (SELECT clinic_id::text FROM public.profiles WHERE id = auth.uid())
        OR
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'SUPER_ADMIN'
    )
);

-- Allow deletion by clinic admins or super admins
CREATE POLICY "Clinic admins can delete own clinic recordings"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'call-recordings' AND (
        (
            (storage.foldername(name))[1] = (SELECT clinic_id::text FROM public.profiles WHERE id = auth.uid())
            AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('CLINIC_ADMIN', 'SUPER_ADMIN')
        )
        OR
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'SUPER_ADMIN'
    )
);
