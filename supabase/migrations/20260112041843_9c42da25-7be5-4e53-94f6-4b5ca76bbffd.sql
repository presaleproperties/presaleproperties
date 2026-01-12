-- Enable required extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;

-- Create a daily cron job to sync MLS data at 6 AM UTC (10 PM PST)
SELECT cron.schedule(
  'daily-mls-sync',
  '0 6 * * *',  -- Run at 6:00 AM UTC daily
  $$
  SELECT net.http_post(
    url := 'https://thvlisplwqhtjpzpedhq.supabase.co/functions/v1/sync-mls-data',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object('maxRecords', 500)
  );
  $$
);