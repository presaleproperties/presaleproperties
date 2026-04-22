-- Schedule daily email-campaign-health-report at 13:00 UTC (≈ 6 AM PT)
DO $$
DECLARE
  v_url text;
  v_key text;
  v_existing_jobid bigint;
BEGIN
  v_url := 'https://thvlisplwqhtjpzpedhq.supabase.co/functions/v1/email-campaign-health-report';

  -- Use service role key from vault if available, else fall back to anon
  SELECT decrypted_secret INTO v_key
  FROM vault.decrypted_secrets
  WHERE name = 'SUPABASE_SERVICE_ROLE_KEY'
  LIMIT 1;

  IF v_key IS NULL THEN
    v_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRodmxpc3Bsd3FodGpwenBlZGhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3Mzk1NDIsImV4cCI6MjA4MjMxNTU0Mn0.lRValr0GwsWLXmd1LewKPauE-3yGhYiCvskXq4XCf5s';
  END IF;

  -- Unschedule any existing job with the same name (idempotent)
  SELECT jobid INTO v_existing_jobid FROM cron.job WHERE jobname = 'email-campaign-health-report-daily';
  IF v_existing_jobid IS NOT NULL THEN
    PERFORM cron.unschedule(v_existing_jobid);
  END IF;

  PERFORM cron.schedule(
    'email-campaign-health-report-daily',
    '0 13 * * *',
    format(
      $cron$
      SELECT extensions.http_post(
        url := %L,
        headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer %s'),
        body := '{}'::jsonb
      );
      $cron$,
      v_url, v_key
    )
  );
END $$;