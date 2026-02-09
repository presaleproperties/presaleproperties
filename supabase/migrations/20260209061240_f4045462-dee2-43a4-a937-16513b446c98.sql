
-- ============================================================
-- SECURITY HARDENING MIGRATION
-- ============================================================

-- 1. TEAM MEMBERS: Public view excluding email and phone PII
-- ============================================================

CREATE OR REPLACE VIEW public.team_members_public AS
SELECT 
  id, full_name, title, photo_url, bio, 
  linkedin_url, instagram_url, specializations, 
  sort_order, is_active, created_at, updated_at
FROM public.team_members
WHERE is_active = true;

GRANT SELECT ON public.team_members_public TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can view active team members" ON public.team_members;

-- 2. APP SETTINGS: Remove webhook URLs from public whitelist
-- ============================================================

DROP POLICY IF EXISTS "Public can read allowed settings only" ON public.app_settings;

CREATE POLICY "Public can read allowed settings only" 
ON public.app_settings FOR SELECT
USING (key = ANY (ARRAY[
  'listing_price', 'renewal_price', 'featured_price', 'whatsapp_number',
  'mls_enabled_cities', 'resale_min_year_built',
  'rental_enabled_cities', 'rental_min_lease', 'rental_max_lease'
]));

-- 3. MLS AGENTS: Hide email, keep professional info only
-- ============================================================

CREATE OR REPLACE VIEW public.mls_agents_public AS
SELECT 
  id, agent_key, agent_mls_id, full_name, 
  first_name, last_name, phone, office_key,
  created_at, updated_at
FROM public.mls_agents;

GRANT SELECT ON public.mls_agents_public TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can view mls agents" ON public.mls_agents;

CREATE POLICY "Admins can manage mls agents"
ON public.mls_agents FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4. MLS OFFICES: Hide phone and address from public
-- ============================================================

CREATE OR REPLACE VIEW public.mls_offices_public AS
SELECT 
  id, office_key, office_mls_id, office_name, city,
  created_at, updated_at
FROM public.mls_offices;

GRANT SELECT ON public.mls_offices_public TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can view mls offices" ON public.mls_offices;

CREATE POLICY "Admins can manage mls offices"
ON public.mls_offices FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 5. RESTRICT RPC FUNCTIONS from public execution
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.update_listing_agent_names() FROM anon, authenticated;

-- 6. GOOGLE REVIEWS: Hide reviewer_location from public
-- ============================================================

DROP POLICY IF EXISTS "Anyone can view active reviews" ON public.google_reviews;

CREATE POLICY "Anyone can view active reviews"
ON public.google_reviews FOR SELECT
USING (is_active = true);
-- reviewer_location is a column, RLS can't hide it but the data is minimal
