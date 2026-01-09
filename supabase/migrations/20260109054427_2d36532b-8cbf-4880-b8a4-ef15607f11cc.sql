-- Add visitor tracking columns to project_leads table
ALTER TABLE public.project_leads
ADD COLUMN IF NOT EXISTS visitor_id text,
ADD COLUMN IF NOT EXISTS session_id text,
ADD COLUMN IF NOT EXISTS intent_score integer,
ADD COLUMN IF NOT EXISTS city_interest jsonb,
ADD COLUMN IF NOT EXISTS project_interest jsonb;

-- Add visitor tracking columns to bookings table
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS visitor_id text,
ADD COLUMN IF NOT EXISTS session_id text,
ADD COLUMN IF NOT EXISTS intent_score integer,
ADD COLUMN IF NOT EXISTS city_interest jsonb,
ADD COLUMN IF NOT EXISTS project_interest jsonb;

-- Add indexes for visitor_id lookups
CREATE INDEX IF NOT EXISTS idx_project_leads_visitor_id ON public.project_leads(visitor_id);
CREATE INDEX IF NOT EXISTS idx_bookings_visitor_id ON public.bookings(visitor_id);