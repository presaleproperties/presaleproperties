-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Daily property alerts at 9:00 AM PST (17:00 UTC)
SELECT cron.schedule(
  'daily-property-alerts',
  '0 17 * * *',
  $$
  SELECT net.http_post(
    url := 'https://thvlisplwqhtjpzpedhq.supabase.co/functions/v1/send-property-alerts?frequency=daily',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Weekly property alerts on Monday at 9:00 AM PST (17:00 UTC)
SELECT cron.schedule(
  'weekly-property-alerts',
  '0 17 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://thvlisplwqhtjpzpedhq.supabase.co/functions/v1/send-property-alerts?frequency=weekly',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);