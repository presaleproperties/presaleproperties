CREATE TABLE IF NOT EXISTS public.crm_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type text NOT NULL DEFAULT 'templates',
  status text NOT NULL DEFAULT 'running',
  triggered_by text NOT NULL DEFAULT 'manual',
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  duration_ms integer,
  pulled_count integer DEFAULT 0,
  pushed_count integer DEFAULT 0,
  error_message text,
  result jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS crm_sync_runs_started_at_idx
  ON public.crm_sync_runs (started_at DESC);

CREATE INDEX IF NOT EXISTS crm_sync_runs_sync_type_idx
  ON public.crm_sync_runs (sync_type, started_at DESC);

ALTER TABLE public.crm_sync_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view sync runs"
  ON public.crm_sync_runs FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert sync runs"
  ON public.crm_sync_runs FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update sync runs"
  ON public.crm_sync_runs FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow the edge function (service role) full access for logging
CREATE POLICY "Service role can manage sync runs"
  ON public.crm_sync_runs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);