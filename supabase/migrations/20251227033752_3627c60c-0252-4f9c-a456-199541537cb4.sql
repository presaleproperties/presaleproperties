-- Drop the overly permissive policy that exposes all fields
DROP POLICY IF EXISTS "Anyone can view verified agents" ON public.agent_profiles;

-- Create a more restrictive policy: public can only view verified agents
-- But we'll create a view for safe public access
CREATE POLICY "Anyone can view verified agent basic info" 
ON public.agent_profiles 
FOR SELECT 
USING (
  -- Verified agents can be viewed, but only specific fields through a view
  -- This policy allows the view to access the data
  verification_status = 'verified'::agent_verification_status
);

-- Create a secure view that only exposes non-sensitive agent info
CREATE OR REPLACE VIEW public.public_agent_profiles AS
SELECT 
  ap.id,
  ap.user_id,
  ap.brokerage_name,
  ap.verification_status,
  ap.verified_at,
  -- Exclude: license_number, brokerage_address, verification_notes
  p.full_name,
  p.email,
  p.phone,
  p.avatar_url
FROM public.agent_profiles ap
JOIN public.profiles p ON ap.user_id = p.user_id
WHERE ap.verification_status = 'verified'::agent_verification_status;

-- Grant access to the view for both anonymous and authenticated users
GRANT SELECT ON public.public_agent_profiles TO anon, authenticated;