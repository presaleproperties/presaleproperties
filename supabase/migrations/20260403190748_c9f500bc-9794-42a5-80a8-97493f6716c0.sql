
CREATE TABLE public.agent_waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  brokerage_name TEXT,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit (no auth required)
CREATE POLICY "Anyone can join the waitlist"
ON public.agent_waitlist
FOR INSERT
WITH CHECK (true);

-- Only authenticated users (admin) can view
CREATE POLICY "Authenticated users can view waitlist"
ON public.agent_waitlist
FOR SELECT
TO authenticated
USING (true);
