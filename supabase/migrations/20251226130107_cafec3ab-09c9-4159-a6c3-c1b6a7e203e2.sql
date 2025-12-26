-- Create storage bucket for listing photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-photos', 'listing-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for listing files (floorplans, documents)
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-files', 'listing-files', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for listing-photos bucket
CREATE POLICY "Anyone can view listing photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'listing-photos');

CREATE POLICY "Authenticated users can upload listing photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'listing-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own listing photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'listing-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own listing photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'listing-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- RLS policies for listing-files bucket
CREATE POLICY "Anyone can view listing files"
ON storage.objects FOR SELECT
USING (bucket_id = 'listing-files');

CREATE POLICY "Authenticated users can upload listing files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'listing-files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own listing files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'listing-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own listing files"
ON storage.objects FOR DELETE
USING (bucket_id = 'listing-files' AND auth.uid()::text = (storage.foldername(name))[1]);