-- Create storage bucket for email template assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('email-assets', 'email-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow admins to upload email assets
CREATE POLICY "Admins can upload email assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'email-assets' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Allow admins to update email assets
CREATE POLICY "Admins can update email assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'email-assets' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Allow admins to delete email assets
CREATE POLICY "Admins can delete email assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'email-assets' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Allow public read access for email assets (needed for email rendering)
CREATE POLICY "Public can view email assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'email-assets');