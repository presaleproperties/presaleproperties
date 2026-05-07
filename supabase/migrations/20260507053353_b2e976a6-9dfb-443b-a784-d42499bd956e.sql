-- Trigger function: push every sent email to CRM outbox
CREATE OR REPLACE FUNCTION public.enqueue_email_sent_to_crm()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only push emails that were actually sent
  IF NEW.status <> 'sent' THEN
    RETURN NEW;
  END IF;

  -- Skip if no recipient email (nothing to stitch in CRM)
  IF NEW.email_to IS NULL OR NEW.email_to = '' THEN
    RETURN NEW;
  END IF;

  PERFORM public.enqueue_crm_outbox(
    p_kind     := 'event',
    p_endpoint := 'push-activity-to-crm',
    p_payload  := jsonb_build_object(
      'event_type', 'email.sent',
      'email', NEW.email_to,
      'source', 'presale_properties_email',
      'payload', jsonb_build_object(
        'email_log_id', NEW.id,
        'subject', NEW.subject,
        'template_type', NEW.template_type,
        'lead_id', NEW.lead_id,
        'campaign_id', NEW.campaign_id,
        'tracking_id', NEW.tracking_id,
        'sent_at', COALESCE(NEW.sent_at, now())
      )
    ),
    p_email    := NEW.email_to,
    p_event_id := 'email_sent:' || NEW.id::text
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'enqueue_email_sent_to_crm failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Trigger on email_logs INSERT
CREATE TRIGGER trg_email_sent_to_crm
  BEFORE INSERT ON public.email_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_email_sent_to_crm();