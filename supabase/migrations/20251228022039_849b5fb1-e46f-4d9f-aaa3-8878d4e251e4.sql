-- Remove the policy that exposes all columns to the public
DROP POLICY IF EXISTS "Anyone can view verified agent basic info" ON public.agent_profiles;

-- The public_agent_profiles view already exists and exposes only safe columns
-- (full_name, email, phone, avatar_url, brokerage_name, verification_status, verified_at)
-- It does NOT include license_number or brokerage_address

-- Grant SELECT on the view to anon and authenticated for public access
GRANT SELECT ON public.public_agent_profiles TO anon, authenticated;