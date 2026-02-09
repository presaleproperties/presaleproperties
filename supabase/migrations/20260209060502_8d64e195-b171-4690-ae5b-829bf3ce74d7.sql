
-- ============================================================
-- SECURITY HARDENING MIGRATION
-- ============================================================

-- 1. INPUT VALIDATION: project_leads INSERT
-- Prevents injection and enforces data quality at DB level
CREATE OR REPLACE FUNCTION public.validate_project_lead_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate email format
  IF NEW.email IS NULL OR NEW.email !~ '^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;

  -- Enforce max lengths to prevent abuse
  IF length(NEW.name) > 200 THEN
    RAISE EXCEPTION 'Name exceeds maximum length';
  END IF;

  IF NEW.phone IS NOT NULL AND length(NEW.phone) > 30 THEN
    RAISE EXCEPTION 'Phone exceeds maximum length';
  END IF;

  IF NEW.message IS NOT NULL AND length(NEW.message) > 5000 THEN
    RAISE EXCEPTION 'Message exceeds maximum length';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_project_lead_insert
BEFORE INSERT ON public.project_leads
FOR EACH ROW
EXECUTE FUNCTION public.validate_project_lead_insert();

-- 2. INPUT VALIDATION: project_leads UPDATE (lock sensitive fields)
-- Anonymous users can only update name, phone, persona, message
CREATE OR REPLACE FUNCTION public.validate_project_lead_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins can update anything
  IF has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  -- Lock email — cannot be changed after initial insert
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    RAISE EXCEPTION 'Cannot modify email address';
  END IF;

  -- Lock attribution fields
  NEW.lead_source := OLD.lead_source;
  NEW.utm_source := OLD.utm_source;
  NEW.utm_medium := OLD.utm_medium;
  NEW.utm_campaign := OLD.utm_campaign;
  NEW.utm_content := OLD.utm_content;
  NEW.utm_term := OLD.utm_term;
  NEW.referrer := OLD.referrer;
  NEW.landing_page := OLD.landing_page;
  NEW.visitor_id := OLD.visitor_id;
  NEW.session_id := OLD.session_id;
  NEW.project_id := OLD.project_id;
  NEW.created_at := OLD.created_at;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_project_lead_update
BEFORE UPDATE ON public.project_leads
FOR EACH ROW
EXECUTE FUNCTION public.validate_project_lead_update();

-- 3. INPUT VALIDATION: bookings INSERT
CREATE OR REPLACE FUNCTION public.validate_booking_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate email
  IF NEW.email IS NULL OR NEW.email !~ '^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;

  -- Validate phone
  IF NEW.phone IS NULL OR length(NEW.phone) < 7 OR length(NEW.phone) > 30 THEN
    RAISE EXCEPTION 'Invalid phone number';
  END IF;

  -- Validate name
  IF NEW.name IS NULL OR length(NEW.name) < 1 OR length(NEW.name) > 200 THEN
    RAISE EXCEPTION 'Invalid name';
  END IF;

  -- Validate notes length
  IF NEW.notes IS NOT NULL AND length(NEW.notes) > 2000 THEN
    RAISE EXCEPTION 'Notes exceed maximum length';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_booking_insert
BEFORE INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.validate_booking_insert();

-- 4. INPUT VALIDATION: newsletter_subscribers INSERT
CREATE OR REPLACE FUNCTION public.validate_newsletter_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate email
  IF NEW.email IS NULL OR NEW.email !~ '^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_newsletter_insert
BEFORE INSERT ON public.newsletter_subscribers
FOR EACH ROW
EXECUTE FUNCTION public.validate_newsletter_insert();

-- 5. INPUT VALIDATION: leads INSERT (listing inquiries)
CREATE OR REPLACE FUNCTION public.validate_lead_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate email
  IF NEW.email IS NULL OR NEW.email !~ '^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;

  IF NEW.name IS NULL OR length(NEW.name) < 1 OR length(NEW.name) > 200 THEN
    RAISE EXCEPTION 'Invalid name';
  END IF;

  IF NEW.message IS NOT NULL AND length(NEW.message) > 5000 THEN
    RAISE EXCEPTION 'Message exceeds maximum length';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_lead_insert
BEFORE INSERT ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.validate_lead_insert();

-- 6. TIGHTEN project_leads UPDATE window: 30 min → 15 min
DROP POLICY IF EXISTS "Anyone can update recent project leads" ON public.project_leads;
CREATE POLICY "Anyone can update recent project leads"
ON public.project_leads
FOR UPDATE
USING (created_at > (now() - interval '15 minutes'))
WITH CHECK (true);

-- 7. ADD missing admin UPDATE policy for project_leads
CREATE POLICY "Admins can update project leads"
ON public.project_leads
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- 8. PREVENT anonymous users from reading back bookings they just created
-- (bookings already has admin-only SELECT, so this is a double-check)
-- No action needed — already secure.

-- 9. ADD rate-limit tracking for email_verification_codes
-- Already has failed_attempts + locked_until columns and edge function checks.
-- Add an index to speed up rate-limit queries
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_email_created
ON public.email_verification_codes (email, created_at DESC);

-- 10. Add index for faster RLS policy evaluation on project_leads
CREATE INDEX IF NOT EXISTS idx_project_leads_created_at
ON public.project_leads (created_at DESC);

-- 11. Add index for faster admin role checks
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role
ON public.user_roles (user_id, role);
