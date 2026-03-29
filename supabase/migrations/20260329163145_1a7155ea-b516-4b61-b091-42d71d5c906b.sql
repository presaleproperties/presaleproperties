ALTER VIEW public.team_members_public SET (security_invoker = true);

CREATE OR REPLACE FUNCTION public.get_public_team_members()
RETURNS TABLE (
  id uuid,
  full_name text,
  title text,
  photo_url text,
  bio text,
  linkedin_url text,
  instagram_url text,
  specializations text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    tm.id,
    tm.full_name,
    tm.title,
    tm.photo_url,
    tm.bio,
    tm.linkedin_url,
    tm.instagram_url,
    tm.specializations
  FROM public.team_members tm
  WHERE tm.is_active = true
  ORDER BY tm.sort_order ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_team_members() TO anon, authenticated;