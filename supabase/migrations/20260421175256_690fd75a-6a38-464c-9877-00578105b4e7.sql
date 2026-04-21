
DROP POLICY IF EXISTS "Anyone can view active developers" ON public.developers;
DROP POLICY IF EXISTS "Allow anonymous insert for code requests" ON public.email_verification_codes;
-- Also drop the duplicate older mls_agents/team_members manage policies (lowercase variants)
DROP POLICY IF EXISTS "Admins can manage mls agents" ON public.mls_agents;
DROP POLICY IF EXISTS "Admins can manage team members" ON public.team_members;
