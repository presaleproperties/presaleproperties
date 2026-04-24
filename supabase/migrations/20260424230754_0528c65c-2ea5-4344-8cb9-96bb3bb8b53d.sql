-- Add a Postgres trigger that fires on every deck_visits insert and pushes
-- the visit event to DealzFlow CRM via the push-activity-to-crm edge function.

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.push_deck_visit_to_crm()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_url text := 'https://thvlisplwqhtjpzpedhq.supabase.co/functions/v1/push-activity-to-crm';
  v_anon text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRodmxpc3Bsd3FodGpwenBlZGhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3Mzk1NDIsImV4cCI6MjA4MjMxNTU0Mn0.lRValr0GwsWLXmd1LewKPauE-3yGhYiCvskXq4XCf5s';
BEGIN
  -- Skip if neither identifier is present
  IF NEW.visitor_id IS NULL AND NEW.lead_email IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM extensions.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_anon
    ),
    body := jsonb_build_object(
      'event_type', 'deck_visit',
      'visitor_id', NEW.visitor_id,
      'email', NEW.lead_email,
      'source', 'presale_properties_deck',
      'payload', jsonb_build_object(
        'slug', NEW.slug,
        'project_name', NEW.project_name,
        'lead_name', NEW.lead_name,
        'visit_number', NEW.visit_number,
        'created_at', NEW.created_at
      )
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never fail the insert because of a CRM push error
  RAISE WARNING 'push_deck_visit_to_crm failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS deck_visits_push_to_crm ON public.deck_visits;
CREATE TRIGGER deck_visits_push_to_crm
  AFTER INSERT ON public.deck_visits
  FOR EACH ROW
  EXECUTE FUNCTION public.push_deck_visit_to_crm();