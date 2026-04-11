INSERT INTO storage.buckets (id, name, public) VALUES ('social-posts', 'social-posts', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Social posts are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'social-posts');

CREATE POLICY "Authenticated users can upload social posts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'social-posts');

CREATE POLICY "Authenticated users can update social posts"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'social-posts');

CREATE POLICY "Authenticated users can delete social posts"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'social-posts');