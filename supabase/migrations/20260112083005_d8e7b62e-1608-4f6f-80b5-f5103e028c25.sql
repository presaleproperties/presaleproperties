-- Enable the pg_cron and pg_net extensions for scheduling and HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;

-- Schedule daily MLS listings sync at 3:00 AM PST (11:00 UTC)
SELECT cron.schedule(
  'daily-mls-listings-sync',
  '0 11 * * *',
  $$
  SELECT net.http_post(
    url := 'https://thvlisplwqhtjpzpedhq.supabase.co/functions/v1/sync-mls-data',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRodmxpc3Bsd3FodGpwenBlZGhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3Mzk1NDIsImV4cCI6MjA4MjMxNTU0Mn0.lRValr0GwsWLXmd1LewKPauE-3yGhYiCvskXq4XCf5s'
    ),
    body := '{"metroVancouverResidential": true, "maxBatches": 50}'::jsonb
  );
  $$
);

-- Schedule daily agent/office sync at 4:00 AM PST (12:00 UTC) - runs after listings sync
SELECT cron.schedule(
  'daily-mls-agents-sync',
  '0 12 * * *',
  $$
  SELECT net.http_post(
    url := 'https://thvlisplwqhtjpzpedhq.supabase.co/functions/v1/sync-mls-agents',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRodmxpc3Bsd3FodGpwenBlZGhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3Mzk1NDIsImV4cCI6MjA4MjMxNTU0Mn0.lRValr0GwsWLXmd1LewKPauE-3yGhYiCvskXq4XCf5s'
    ),
    body := '{}'::jsonb
  );
  $$
);