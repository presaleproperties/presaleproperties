-- Create table for storing email verification codes
CREATE TABLE public.email_verification_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_email_verification_codes_email ON public.email_verification_codes(email);
CREATE INDEX idx_email_verification_codes_expires ON public.email_verification_codes(expires_at);

-- Enable RLS
ALTER TABLE public.email_verification_codes ENABLE ROW LEVEL SECURITY;

-- No direct access from client - all operations go through edge functions
-- Public can insert (for requesting codes) but verification happens server-side
CREATE POLICY "Allow anonymous insert for code requests"
ON public.email_verification_codes
FOR INSERT
WITH CHECK (true);

-- Cleanup old codes automatically (optional, can be done via cron)
-- Codes expire after 10 minutes