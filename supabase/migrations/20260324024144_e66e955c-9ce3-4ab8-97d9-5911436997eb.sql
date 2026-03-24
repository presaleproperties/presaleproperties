-- Fix branding storage bucket: tighten policies from any-authenticated to admin-only
DROP POLICY IF EXISTS "Admins can upload branding assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update branding assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete branding assets" ON storage.objects;

CREATE POLICY "Admins can upload branding assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'branding' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update branding assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'branding' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete branding assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'branding' AND public.has_role(auth.uid(), 'admin'::app_role));
