-- One-time seed flag for CRM template sync.
-- Stores key/value flags for system-level operations (admin-only access).

CREATE TABLE IF NOT EXISTS public.system_flags (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.system_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read system flags"
  ON public.system_flags FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update system flags"
  ON public.system_flags FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Seed the initial flag for the CRM template sync. Edge function (service role)
-- will check this and flip it to true after the first successful run.
INSERT INTO public.system_flags (key, value)
VALUES ('crm_templates_seed_completed', '{"completed": false}'::jsonb)
ON CONFLICT (key) DO NOTHING;