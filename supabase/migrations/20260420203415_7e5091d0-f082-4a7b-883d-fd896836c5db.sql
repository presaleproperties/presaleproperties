-- 1. Add tracking columns to project_leads (UTMs and landing_page already exist)
ALTER TABLE public.project_leads
  ADD COLUMN IF NOT EXISTS event_id uuid,
  ADD COLUMN IF NOT EXISTS fbp text,
  ADD COLUMN IF NOT EXISTS fbc text,
  ADD COLUMN IF NOT EXISTS user_agent text,
  ADD COLUMN IF NOT EXISTS ip_address text,
  ADD COLUMN IF NOT EXISTS value numeric;

CREATE INDEX IF NOT EXISTS idx_project_leads_event_id ON public.project_leads(event_id);

-- 2. Create lead_sync_log table
CREATE TABLE IF NOT EXISTS public.lead_sync_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid,
  destination text NOT NULL,
  status text NOT NULL,
  status_code integer,
  response jsonb,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_sync_log_lead_id ON public.lead_sync_log(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_sync_log_destination ON public.lead_sync_log(destination);
CREATE INDEX IF NOT EXISTS idx_lead_sync_log_created_at ON public.lead_sync_log(created_at DESC);

ALTER TABLE public.lead_sync_log ENABLE ROW LEVEL SECURITY;

-- Admins can view and manage all sync logs
CREATE POLICY "Admins can view lead sync logs"
  ON public.lead_sync_log
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage lead sync logs"
  ON public.lead_sync_log
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Block anonymous access entirely; edge functions write via service role and bypass RLS
CREATE POLICY "Block anonymous access to lead sync logs"
  ON public.lead_sync_log
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);