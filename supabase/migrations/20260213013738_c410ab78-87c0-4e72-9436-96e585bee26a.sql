
-- Fix last security definer view: mls_offices_public
DROP VIEW IF EXISTS public.mls_offices_public;
CREATE VIEW public.mls_offices_public
WITH (security_invoker = true)
AS
SELECT 
  id,
  office_key,
  office_mls_id,
  office_name,
  city,
  created_at,
  updated_at
FROM mls_offices;

GRANT SELECT ON public.mls_offices_public TO anon, authenticated;
