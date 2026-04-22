-- Email audit run log: tracks scheduled re-audits of email templates so any
-- template or route change that breaks tracked project links is caught
-- before campaigns go live.
CREATE TABLE public.email_audit_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ran_at timestamptz NOT NULL DEFAULT now(),
  template_key text NOT NULL,        -- e.g. 'recommendation', 'catalogue'
  status text NOT NULL,              -- 'ok' | 'failed' | 'error'
  total_links integer NOT NULL DEFAULT 0,
  total_errors integer NOT NULL DEFAULT 0,
  projects_sampled integer NOT NULL DEFAULT 0,
  errors jsonb,                      -- array of {rule, href, context, expected}
  trigger_source text NOT NULL DEFAULT 'cron',
  duration_ms integer
);

CREATE INDEX idx_email_audit_runs_ran_at ON public.email_audit_runs (ran_at DESC);
CREATE INDEX idx_email_audit_runs_status ON public.email_audit_runs (status, ran_at DESC);

ALTER TABLE public.email_audit_runs ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit history (it can reveal internal URL structure).
CREATE POLICY "Admins can view audit runs"
  ON public.email_audit_runs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Inserts come from the edge function via service role; no public insert policy needed.
