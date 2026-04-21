
-- MLS AGENTS
ALTER TABLE public.mls_agents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view mls agents" ON public.mls_agents;
DROP POLICY IF EXISTS "Anyone can view mls agents" ON public.mls_agents;
DROP POLICY IF EXISTS "mls_agents_select_all" ON public.mls_agents;
DROP POLICY IF EXISTS "Admins and agents can view mls_agents" ON public.mls_agents;
DROP POLICY IF EXISTS "Admins can manage mls_agents" ON public.mls_agents;

CREATE POLICY "Admins and agents can view mls_agents"
  ON public.mls_agents FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'agent'::app_role)
  );

CREATE POLICY "Admins can manage mls_agents"
  ON public.mls_agents FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- TEAM MEMBERS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view team members" ON public.team_members;
DROP POLICY IF EXISTS "Anyone can view team members" ON public.team_members;
DROP POLICY IF EXISTS "team_members_public_read" ON public.team_members;
DROP POLICY IF EXISTS "Admins can view team_members" ON public.team_members;
DROP POLICY IF EXISTS "Admins can manage team_members" ON public.team_members;

CREATE POLICY "Admins can view team_members"
  ON public.team_members FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage team_members"
  ON public.team_members FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- DEVELOPERS
ALTER TABLE public.developers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view developers" ON public.developers;
DROP POLICY IF EXISTS "Anyone can view developers" ON public.developers;
DROP POLICY IF EXISTS "developers_public_read" ON public.developers;
DROP POLICY IF EXISTS "Admins can view developers full" ON public.developers;
DROP POLICY IF EXISTS "Admins can manage developers" ON public.developers;

CREATE POLICY "Admins can view developers full"
  ON public.developers FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage developers"
  ON public.developers FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE VIEW public.developers_public
WITH (security_invoker=on) AS
  SELECT
    id, name, slug, logo_url, description, website_url,
    founded_year, cities_active, focus, city,
    project_count, verification_status, is_active,
    created_at, updated_at
  FROM public.developers
  WHERE is_active = true;

GRANT SELECT ON public.developers_public TO anon, authenticated;

-- EMAIL VERIFICATION CODES
ALTER TABLE public.email_verification_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read codes" ON public.email_verification_codes;
DROP POLICY IF EXISTS "Public can view codes" ON public.email_verification_codes;
DROP POLICY IF EXISTS "verification_codes_public" ON public.email_verification_codes;
DROP POLICY IF EXISTS "Deny anon access to verification codes" ON public.email_verification_codes;
DROP POLICY IF EXISTS "Deny anon insert to verification codes" ON public.email_verification_codes;
DROP POLICY IF EXISTS "Deny anon update to verification codes" ON public.email_verification_codes;

CREATE POLICY "Deny anon access to verification codes"
  ON public.email_verification_codes FOR SELECT USING (false);
CREATE POLICY "Deny anon insert to verification codes"
  ON public.email_verification_codes FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny anon update to verification codes"
  ON public.email_verification_codes FOR UPDATE USING (false);

-- STORAGE BUCKETS
DROP POLICY IF EXISTS "Public can upload lead magnets" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload lead-magnets" ON storage.objects;
DROP POLICY IF EXISTS "Public can upload social posts" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload social-posts" ON storage.objects;
DROP POLICY IF EXISTS "Public read lead-magnets" ON storage.objects;
DROP POLICY IF EXISTS "Admins manage lead-magnets" ON storage.objects;
DROP POLICY IF EXISTS "Admins update lead-magnets" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete lead-magnets" ON storage.objects;
DROP POLICY IF EXISTS "Public read social-posts" ON storage.objects;
DROP POLICY IF EXISTS "Staff manage social-posts insert" ON storage.objects;
DROP POLICY IF EXISTS "Staff manage social-posts update" ON storage.objects;
DROP POLICY IF EXISTS "Staff manage social-posts delete" ON storage.objects;

CREATE POLICY "Public read lead-magnets"
  ON storage.objects FOR SELECT USING (bucket_id = 'lead-magnets');
CREATE POLICY "Admins manage lead-magnets"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'lead-magnets' AND public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update lead-magnets"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'lead-magnets' AND public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete lead-magnets"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'lead-magnets' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public read social-posts"
  ON storage.objects FOR SELECT USING (bucket_id = 'social-posts');
CREATE POLICY "Staff manage social-posts insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'social-posts'
    AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'agent'::app_role))
  );
CREATE POLICY "Staff manage social-posts update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'social-posts'
    AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'agent'::app_role))
  );
CREATE POLICY "Staff manage social-posts delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'social-posts'
    AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'agent'::app_role))
  );
