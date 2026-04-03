
ALTER TABLE public.email_logs
ADD COLUMN IF NOT EXISTS opened_at timestamptz,
ADD COLUMN IF NOT EXISTS open_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_opened_at timestamptz,
ADD COLUMN IF NOT EXISTS tracking_id uuid DEFAULT gen_random_uuid();

CREATE INDEX IF NOT EXISTS idx_email_logs_tracking_id ON public.email_logs(tracking_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON public.email_logs(sent_at DESC);
