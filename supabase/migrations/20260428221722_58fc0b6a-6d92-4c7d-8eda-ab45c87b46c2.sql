-- Trigger: enqueue booking events to crm_outbox so DealsFlow gets them
-- via the same durable two-phase delivery as leads/activity.

CREATE OR REPLACE FUNCTION public.enqueue_booking_to_crm()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_type text;
  v_payload jsonb;
BEGIN
  -- Decide event type
  IF TG_OP = 'INSERT' THEN
    v_event_type := 'booking.created';
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    v_event_type := 'booking.' || NEW.status;  -- confirmed/cancelled/completed
  ELSE
    RETURN NEW;
  END IF;

  v_payload := jsonb_build_object(
    'event_type', v_event_type,
    'email', NEW.email,
    'source', 'presale_properties_booking',
    'payload', jsonb_build_object(
      'booking_id', NEW.id,
      'appointment_type', NEW.appointment_type,
      'appointment_date', NEW.appointment_date,
      'appointment_time', NEW.appointment_time,
      'status', NEW.status,
      'name', NEW.name,
      'email', NEW.email,
      'phone', NEW.phone,
      'project_id', NEW.project_id,
      'project_name', NEW.project_name,
      'project_url', NEW.project_url,
      'project_city', NEW.project_city,
      'buyer_type', NEW.buyer_type,
      'timeline', NEW.timeline,
      'notes', NEW.notes,
      'utm_source', NEW.utm_source,
      'utm_medium', NEW.utm_medium,
      'utm_campaign', NEW.utm_campaign,
      'visitor_id', NEW.visitor_id,
      'created_at', NEW.created_at
    )
  );

  PERFORM public.enqueue_crm_outbox(
    p_kind     := 'event',
    p_endpoint := 'push-activity-to-crm',
    p_payload  := v_payload,
    p_email    := NEW.email,
    p_event_id := v_event_type || ':' || NEW.id::text
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block the booking insert/update on CRM enqueue failure.
  RAISE WARNING 'enqueue_booking_to_crm failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enqueue_booking_to_crm ON public.bookings;
CREATE TRIGGER trg_enqueue_booking_to_crm
AFTER INSERT OR UPDATE OF status ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.enqueue_booking_to_crm();