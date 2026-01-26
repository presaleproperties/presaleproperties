-- Add non_indexed_analysis column to seo_health_checks table
ALTER TABLE public.seo_health_checks 
ADD COLUMN IF NOT EXISTS non_indexed_analysis jsonb DEFAULT '{}'::jsonb;