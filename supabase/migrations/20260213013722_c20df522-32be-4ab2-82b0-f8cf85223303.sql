
-- ============================================
-- SECURITY AUDIT FIX: Convert Security Definer Views to Security Invoker
-- and strip PII from public-facing views
-- ============================================

-- 1. Fix mls_agents_public view - already excludes email, change to INVOKER
DROP VIEW IF EXISTS public.mls_agents_public;
CREATE VIEW public.mls_agents_public
WITH (security_invoker = true)
AS
SELECT 
  id,
  agent_key,
  agent_mls_id,
  full_name,
  first_name,
  last_name,
  phone,
  office_key,
  created_at,
  updated_at
FROM mls_agents;

-- 2. Fix public_agent_profiles view - REMOVE email and phone (PII)
DROP VIEW IF EXISTS public.public_agent_profiles;
CREATE VIEW public.public_agent_profiles
WITH (security_invoker = true)
AS
SELECT 
  ap.id,
  ap.user_id,
  ap.brokerage_name,
  ap.verification_status,
  ap.verified_at,
  p.full_name,
  p.avatar_url
FROM agent_profiles ap
JOIN profiles p ON ap.user_id = p.user_id
WHERE ap.verification_status = 'verified'::agent_verification_status;

-- 3. Fix team_members_public view - already excludes sensitive fields
DROP VIEW IF EXISTS public.team_members_public;
CREATE VIEW public.team_members_public
WITH (security_invoker = true)
AS
SELECT 
  id,
  full_name,
  title,
  photo_url,
  bio,
  linkedin_url,
  instagram_url,
  specializations,
  sort_order,
  is_active,
  created_at,
  updated_at
FROM team_members
WHERE is_active = true;

-- Grant SELECT on views to anon and authenticated roles
GRANT SELECT ON public.mls_agents_public TO anon, authenticated;
GRANT SELECT ON public.public_agent_profiles TO anon, authenticated;
GRANT SELECT ON public.team_members_public TO anon, authenticated;
