-- Enable pg_cron and pg_net extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule geocoding job to run nightly at 5:00 AM PST (13:00 UTC)
-- This runs after the MLS sync (3:00 AM PST) and agent sync (4:00 AM PST)
SELECT cron.schedule(
  'geocode-mls-listings-nightly',
  '0 13 * * *', -- 5:00 AM PST = 13:00 UTC
  $$
  SELECT net.http_post(
    url := 'https://thvlisplwqhtjpzpedhq.supabase.co/functions/v1/geocode-mls-listings',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object('batchSize', 100, 'onlyMissing', true)
  );
  $$
);

-- Also schedule a second run at 5:30 AM PST to process more listings
SELECT cron.schedule(
  'geocode-mls-listings-nightly-2',
  '30 13 * * *', -- 5:30 AM PST = 13:30 UTC
  $$
  SELECT net.http_post(
    url := 'https://thvlisplwqhtjpzpedhq.supabase.co/functions/v1/geocode-mls-listings',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object('batchSize', 100, 'onlyMissing', true)
  );
  $$
);

-- Third run at 6:00 AM PST
SELECT cron.schedule(
  'geocode-mls-listings-nightly-3',
  '0 14 * * *', -- 6:00 AM PST = 14:00 UTC
  $$
  SELECT net.http_post(
    url := 'https://thvlisplwqhtjpzpedhq.supabase.co/functions/v1/geocode-mls-listings',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object('batchSize', 100, 'onlyMissing', true)
  );
  $$
);