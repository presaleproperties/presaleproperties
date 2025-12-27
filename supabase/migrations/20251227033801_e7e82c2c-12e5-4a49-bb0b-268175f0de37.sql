-- Drop the view and recreate with SECURITY INVOKER
DROP VIEW IF EXISTS public.public_agent_profiles;

-- Create a secure view with SECURITY INVOKER (respects RLS of querying user)
CREATE VIEW public.public_agent_profiles 
WITH (security_invoker = true) AS
SELECT 
  ap.id,
  ap.user_id,
  ap.brokerage_name,
  ap.verification_status,
  ap.verified_at,
  p.full_name,
  p.email,
  p.phone,
  p.avatar_url
FROM public.agent_profiles ap
JOIN public.profiles p ON ap.user_id = p.user_id
WHERE ap.verification_status = 'verified'::agent_verification_status;

-- Grant access to the view for both anonymous and authenticated users
GRANT SELECT ON public.public_agent_profiles TO anon, authenticated;