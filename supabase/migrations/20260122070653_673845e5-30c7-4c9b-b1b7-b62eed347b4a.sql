-- Add property_type column to landing_page_campaigns table
ALTER TABLE public.landing_page_campaigns 
ADD COLUMN IF NOT EXISTS property_type TEXT DEFAULT 'condo' CHECK (property_type IN ('condo', 'townhome'));