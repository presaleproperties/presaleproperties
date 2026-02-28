
-- Recreate mls_agents_public view to only expose name and brokerage linkage
DROP VIEW IF EXISTS public.mls_agents_public;

CREATE VIEW public.mls_agents_public
WITH (security_invoker = on) AS
SELECT
  agent_key,
  full_name,
  first_name,
  last_name,
  office_key
FROM public.mls_agents;

-- Ensure base table SELECT is restricted to admins only.
-- The previous migration already removed the old policy and added the admin-only one,
-- but we enforce it again cleanly here.
DROP POLICY IF EXISTS "Admins can manage mls agents" ON public.mls_agents;

CREATE POLICY "Admins can manage mls agents"
  ON public.mls_agents
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
