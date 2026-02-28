
-- =============================================
-- PROFILES: Ensure anonymous users cannot access
-- The existing policies allow own-user and admin SELECT, 
-- but we add an explicit authenticated-only constraint
-- by dropping and re-creating SELECT policies with role targeting.
-- =============================================

-- Drop existing SELECT policies and recreate them scoped to 'authenticated' role
-- so anonymous (anon) role is always excluded at the policy level.

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Also scope INSERT and UPDATE to authenticated only
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);


-- =============================================
-- MLS_AGENTS: Restrict base table to admins only
-- Public access should go through mls_agents_public view
-- =============================================

-- Drop existing policy and replace with strict admin-only access
DROP POLICY IF EXISTS "Admins can manage mls agents" ON public.mls_agents;

-- Admins get full access
CREATE POLICY "Admins can manage mls agents"
  ON public.mls_agents
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Explicitly deny any other SELECT (belt-and-suspenders: no anon or non-admin reads)
-- With RLS enabled and only the admin policy above, non-admins already get denied.
-- No additional policy needed — silence = deny in Postgres RLS.
