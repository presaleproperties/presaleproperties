-- Create notifications queue table
CREATE TABLE public.notifications_queue (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_email text NOT NULL,
  recipient_type text NOT NULL,
  notification_type text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  metadata jsonb DEFAULT '{}',
  status text DEFAULT 'pending' NOT NULL,
  created_at timestamptz DEFAULT now(),
  sent_at timestamptz
);

-- Validation trigger for status and recipient_type
CREATE OR REPLACE FUNCTION public.validate_notification_queue()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.recipient_type NOT IN ('admin','developer','client') THEN
    RAISE EXCEPTION 'Invalid recipient_type: %', NEW.recipient_type;
  END IF;
  IF NEW.status NOT IN ('pending','sent','failed') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_notification
  BEFORE INSERT OR UPDATE ON public.notifications_queue
  FOR EACH ROW EXECUTE FUNCTION public.validate_notification_queue();

-- Enable RLS (only service role / triggers can access)
ALTER TABLE public.notifications_queue ENABLE ROW LEVEL SECURITY;

-- Admin read policy
CREATE POLICY "Admins can view notifications"
  ON public.notifications_queue
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ─── Trigger: new off_market_access row → notify admin ───
CREATE OR REPLACE FUNCTION public.notify_admin_new_access_request()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  v_project_name text;
BEGIN
  SELECT project_name INTO v_project_name
  FROM public.off_market_listings
  WHERE id = NEW.listing_id;

  INSERT INTO public.notifications_queue (recipient_email, recipient_type, notification_type, subject, body, metadata)
  VALUES (
    'info@presaleproperties.com',
    'admin',
    'new_access_request',
    '🔓 New Off-Market Access Request: ' || COALESCE(v_project_name, 'Unknown'),
    'New access request from ' || COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, '') || ' (' || NEW.email || ') for ' || COALESCE(v_project_name, 'Unknown') || '. Budget: ' || COALESCE(NEW.budget, 'N/A'),
    jsonb_build_object(
      'access_id', NEW.id,
      'listing_id', NEW.listing_id,
      'email', NEW.email,
      'first_name', NEW.first_name,
      'last_name', NEW.last_name,
      'phone', NEW.phone,
      'budget', NEW.budget
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_new_access_request
  AFTER INSERT ON public.off_market_access
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_access_request();

-- ─── Trigger: developer verification status change → notify developer ───
CREATE OR REPLACE FUNCTION public.notify_developer_verification_change()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  v_email text;
BEGIN
  IF OLD.verification_status IS DISTINCT FROM NEW.verification_status
     AND NEW.verification_status IN ('verified', 'rejected') THEN

    SELECT email INTO v_email FROM auth.users WHERE id = NEW.user_id;

    IF v_email IS NOT NULL THEN
      IF NEW.verification_status = 'verified' THEN
        INSERT INTO public.notifications_queue (recipient_email, recipient_type, notification_type, subject, body, metadata)
        VALUES (
          v_email, 'developer', 'developer_verified',
          '✅ Your Developer Account is Approved — PresaleProperties.com',
          'Hi ' || NEW.contact_name || ', your developer account for ' || NEW.company_name || ' has been approved. Log in to upload inventory at https://presaleproperties.com/developer-portal/login',
          jsonb_build_object('developer_id', NEW.id, 'company_name', NEW.company_name)
        );
      ELSE
        INSERT INTO public.notifications_queue (recipient_email, recipient_type, notification_type, subject, body, metadata)
        VALUES (
          v_email, 'developer', 'developer_rejected',
          'Developer Application Update — PresaleProperties.com',
          'Hi ' || NEW.contact_name || ', your developer application for ' || NEW.company_name || ' was not approved at this time. Contact info@presaleproperties.com for questions.',
          jsonb_build_object('developer_id', NEW.id, 'company_name', NEW.company_name)
        );
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_developer_verification
  AFTER UPDATE ON public.developer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_developer_verification_change();

-- ─── Trigger: listing published → notify developer ───
CREATE OR REPLACE FUNCTION public.notify_developer_listing_published()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
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
          '🎉 Your ' || NEW.project_name || ' inventory is now live!',
          'Great news — your ' || NEW.project_name || ' inventory is now published on presaleproperties.com.',
          jsonb_build_object('listing_id', NEW.id, 'project_name', NEW.project_name)
        );
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_listing_published
  AFTER UPDATE ON public.off_market_listings
  FOR EACH ROW EXECUTE FUNCTION public.notify_developer_listing_published();