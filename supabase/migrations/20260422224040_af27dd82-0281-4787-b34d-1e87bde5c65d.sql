ALTER TABLE public.alert_config
  ADD COLUMN IF NOT EXISTS email_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS slack_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS slack_webhook_url text,
  ADD COLUMN IF NOT EXISTS audit_failure_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS bounce_spike_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS bounce_spike_threshold integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS click_anomaly_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS click_anomaly_drop_pct integer NOT NULL DEFAULT 50;