
CREATE TABLE IF NOT EXISTS public.email_link_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email_log_id UUID REFERENCES public.email_logs(id) ON DELETE CASCADE,
  tracking_id TEXT,
  recipient_email TEXT,
  destination_url TEXT,
  cta TEXT,
  section TEXT,
  project_id UUID,
  project_slug TEXT,
  category TEXT,
  city TEXT,
  neighborhood TEXT,
  slot INTEGER,
  user_agent TEXT,
  referer TEXT,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_link_clicks_email_log_id ON public.email_link_clicks(email_log_id);
CREATE INDEX IF NOT EXISTS idx_email_link_clicks_project_id ON public.email_link_clicks(project_id);
CREATE INDEX IF NOT EXISTS idx_email_link_clicks_neighborhood ON public.email_link_clicks(neighborhood);
CREATE INDEX IF NOT EXISTS idx_email_link_clicks_city ON public.email_link_clicks(city);
CREATE INDEX IF NOT EXISTS idx_email_link_clicks_clicked_at ON public.email_link_clicks(clicked_at DESC);

ALTER TABLE public.email_link_clicks ENABLE ROW LEVEL SECURITY;

-- Only admins can read aggregated click data
CREATE POLICY "Admins can view email link clicks"
  ON public.email_link_clicks
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Inserts happen via service role from the edge function (bypasses RLS),
-- so no INSERT policy is needed for client-side use.
