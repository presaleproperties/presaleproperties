
CREATE TABLE IF NOT EXISTS public.vip_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  source TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  landing_page TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vip_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert vip registrations"
ON public.vip_registrations
FOR INSERT
WITH CHECK (true);
