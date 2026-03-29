ALTER VIEW public.team_members_public SET (security_invoker = false);
GRANT SELECT ON public.team_members_public TO anon, authenticated;