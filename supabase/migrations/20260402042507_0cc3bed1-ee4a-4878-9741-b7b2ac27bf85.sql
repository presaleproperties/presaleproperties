CREATE OR REPLACE FUNCTION public.notify_developer_listing_published()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dev developer_profiles%ROWTYPE;
  v_email text;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'published' AND NEW.developer_id IS NOT NULL THEN
    SELECT * INTO v_dev FROM public.developer_profiles WHERE id = NEW.developer_id;
    IF v_dev.id IS NOT NULL THEN
      SELECT email INTO v_email FROM auth.users WHERE id = v_dev.user_id;
      IF v_email IS NOT NULL THEN
        INSERT INTO public.notifications_queue (recipient_email, recipient_type, notification_type, subject, body, metadata)
        VALUES (
          v_email, 'developer', 'listing_published',
          '🎉 Your ' || COALESCE(NEW.linked_project_name, 'project') || ' inventory is now live!',
          'Great news — your ' || COALESCE(NEW.linked_project_name, 'project') || ' inventory is now published on presaleproperties.com.',
          jsonb_build_object('listing_id', NEW.id, 'project_name', NEW.linked_project_name)
        );
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;