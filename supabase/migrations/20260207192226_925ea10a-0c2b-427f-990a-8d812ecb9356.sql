-- Allow updating project leads that were recently created (within 30 minutes)
-- This supports the two-step lead capture flow where email is saved first, then updated with full details
CREATE POLICY "Anyone can update recent project leads"
ON public.project_leads
FOR UPDATE
USING (created_at > now() - interval '30 minutes')
WITH CHECK (true);