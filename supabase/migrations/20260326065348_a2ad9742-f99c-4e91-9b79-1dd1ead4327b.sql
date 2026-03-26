
-- Create storage bucket for lead magnet PDFs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('lead-magnets', 'lead-magnets', true, 52428800, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- RLS: anyone can read (public bucket)
CREATE POLICY "Public read lead magnets"
ON storage.objects FOR SELECT
USING (bucket_id = 'lead-magnets');

-- RLS: only authenticated admins can upload/delete
CREATE POLICY "Admin upload lead magnets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'lead-magnets');

CREATE POLICY "Admin delete lead magnets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'lead-magnets');
