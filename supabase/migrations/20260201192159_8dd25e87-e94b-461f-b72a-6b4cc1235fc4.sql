-- Add storage policy for admins to upload team member photos
CREATE POLICY "Admins can upload team photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'team'
  AND public.has_role(auth.uid(), 'admin')
);

-- Add policy for admins to update/delete team photos
CREATE POLICY "Admins can manage team photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'team'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update team photos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'team'
  AND public.has_role(auth.uid(), 'admin')
);