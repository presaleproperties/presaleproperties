
CREATE TABLE public.preflight_send_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  asset_id uuid,
  template_label text,
  subject text,
  recipient_count integer NOT NULL DEFAULT 0,
  -- overall outcome of the preflight run
  status text NOT NULL CHECK (status IN ('passed','passed_with_warnings','blocked')),
  -- counters for quick filtering / dashboards
  total_checks integer NOT NULL DEFAULT 0,
  passed_count integer NOT NULL DEFAULT 0,
  warn_count integer NOT NULL DEFAULT 0,
  blocker_count integer NOT NULL DEFAULT 0,
  -- whether the user actually proceeded with sending after the preflight
  send_attempted boolean NOT NULL DEFAULT false,
  send_succeeded boolean,
  send_error text,
  -- full check breakdown for the troubleshooting view
  checks jsonb NOT NULL DEFAULT '[]'::jsonb
);

CREATE INDEX idx_preflight_send_log_created_at ON public.preflight_send_log (created_at DESC);
CREATE INDEX idx_preflight_send_log_status ON public.preflight_send_log (status);
CREATE INDEX idx_preflight_send_log_asset_id ON public.preflight_send_log (asset_id);

ALTER TABLE public.preflight_send_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read the audit trail
CREATE POLICY "Admins can view preflight logs"
  ON public.preflight_send_log
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can insert their own row (so the send dialog can log)
CREATE POLICY "Authenticated users can insert preflight logs"
  ON public.preflight_send_log
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Allow updating the row a moment later (to record send_succeeded / error)
CREATE POLICY "Users can update their own preflight logs"
  ON public.preflight_send_log
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));
