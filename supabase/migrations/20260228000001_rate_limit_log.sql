-- Migration: Create rate_limit_log table for edge function rate limiting
-- Used by: send-project-lead, send-inquiry-notification, send-lead-notification,
--          og-property-meta, send-booking-notification, track-client-activity,
--          send-behavior-event, send-verification-code

CREATE TABLE IF NOT EXISTS public.rate_limit_log (
  id          bigserial PRIMARY KEY,
  rate_key    text        NOT NULL,  -- format: "function-name:ip-address"
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups by key + time window
CREATE INDEX IF NOT EXISTS idx_rate_limit_log_key_time 
  ON public.rate_limit_log (rate_key, created_at DESC);

-- RLS: no direct user access — only service_role (edge functions) can write
ALTER TABLE public.rate_limit_log ENABLE ROW LEVEL SECURITY;

-- Auto-cleanup: delete entries older than 2 hours to keep the table small
-- This runs via a cron or can be called manually
CREATE OR REPLACE FUNCTION cleanup_rate_limit_log()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  DELETE FROM public.rate_limit_log
  WHERE created_at < now() - interval '2 hours';
$$;

-- Grant service_role full access (edge functions use service_role key)
GRANT ALL ON public.rate_limit_log TO service_role;
GRANT USAGE, SELECT ON SEQUENCE rate_limit_log_id_seq TO service_role;
