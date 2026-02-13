
-- Create storage bucket for branding assets (favicon, logo, og-image)
INSERT INTO storage.buckets (id, name, public)
VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Branding assets are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'branding');

-- Allow authenticated users (admins) to upload
CREATE POLICY "Admins can upload branding assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'branding' AND auth.role() = 'authenticated');

-- Allow authenticated users to update
CREATE POLICY "Admins can update branding assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'branding' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete
CREATE POLICY "Admins can delete branding assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'branding' AND auth.role() = 'authenticated');
