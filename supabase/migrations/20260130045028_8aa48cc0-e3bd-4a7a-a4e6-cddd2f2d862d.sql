-- Add video_url column to presale_projects for YouTube/Vimeo links
ALTER TABLE public.presale_projects 
ADD COLUMN IF NOT EXISTS video_url text;