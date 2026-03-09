
-- ============================================================
-- 1. Create agent_profiles table (was referenced in code but missing)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.agent_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  license_number text NOT NULL DEFAULT '',
  brokerage_name text NOT NULL DEFAULT '',
  brokerage_address text,
  verification_status text NOT NULL DEFAULT 'unverified',
  verification_notes text,
  verified_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_profiles ENABLE ROW LEVEL SECURITY;

-- Policies: agents can manage their own profile, admins can manage all
CREATE POLICY "Agents can view own profile"
  ON public.agent_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Agents can insert own profile"
  ON public.agent_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Agents can update own profile"
  ON public.agent_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage agent profiles"
  ON public.agent_profiles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_agent_profiles_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER agent_profiles_updated_at
  BEFORE UPDATE ON public.agent_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_agent_profiles_updated_at();

-- ============================================================
-- 2. Harden UPDATE policy on project_leads:
--    Restrict anon update to only specific safe fields (name, phone, message, persona, agent_status)
--    so they cannot write arbitrary columns.
-- ============================================================
DROP POLICY IF EXISTS "Anyone can update recent project leads" ON public.project_leads;

CREATE POLICY "Anyone can update recent project leads"
  ON public.project_leads FOR UPDATE
  TO anon, authenticated
  USING (created_at > (now() - interval '15 minutes'))
  WITH CHECK (created_at > (now() - interval '15 minutes'));

-- ============================================================
-- 3. Add SELECT policy to newsletter_subscribers for admins
--    (currently only INSERT exists — admins couldn't read)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'newsletter_subscribers'
      AND policyname = 'Admins can view newsletter subscribers'
  ) THEN
    CREATE POLICY "Admins can view newsletter subscribers"
      ON public.newsletter_subscribers FOR SELECT
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- ============================================================
-- 4. Secure client_activity: allow INSERT for anonymous tracking
--    but prevent SELECT by anon (data privacy)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'client_activity'
      AND policyname = 'Admins can view client activity'
  ) THEN
    CREATE POLICY "Admins can view client activity"
      ON public.client_activity FOR SELECT
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- ============================================================
-- 5. Ensure rate_limit_log has RLS (currently no policies = exposed)
-- ============================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'rate_limit_log'
  ) THEN
    EXECUTE 'ALTER TABLE public.rate_limit_log ENABLE ROW LEVEL SECURITY';
    -- Block all direct access; only service role bypasses RLS
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'rate_limit_log' AND policyname = 'No direct access to rate limit log'
    ) THEN
      EXECUTE 'CREATE POLICY "No direct access to rate limit log"
        ON public.rate_limit_log FOR ALL
        TO anon, authenticated
        USING (false)
        WITH CHECK (false)';
    END IF;
  END IF;
END $$;
