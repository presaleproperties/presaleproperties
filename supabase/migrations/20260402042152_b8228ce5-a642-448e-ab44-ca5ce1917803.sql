CREATE OR REPLACE FUNCTION public.notify_admin_new_access_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_name text;
BEGIN
  SELECT linked_project_name INTO v_project_name
  FROM public.off_market_listings
  WHERE id = NEW.listing_id;

  INSERT INTO public.notifications_queue (recipient_email, recipient_type, notification_type, subject, body, metadata)
  VALUES (
    'info@presaleproperties.com',
    'admin',
    'new_access_request',
    '🔓 New Off-Market Access Request: ' || COALESCE(v_project_name, 'Unknown'),
    'New access request from ' || COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, '') || ' (' || NEW.email || ') for ' || COALESCE(v_project_name, 'Unknown') || '. Budget: ' || COALESCE(NEW.budget_range, 'N/A'),
    jsonb_build_object(
      'access_id', NEW.id,
      'listing_id', NEW.listing_id,
      'email', NEW.email,
      'first_name', NEW.first_name,
      'last_name', NEW.last_name,
      'phone', NEW.phone,
      'budget', NEW.budget_range
    )
  );
  RETURN NEW;
END;
$$;