-- Fix SECURITY DEFINER views by recreating them with security_invoker = on
-- This ensures views respect RLS policies of the querying user, not the view creator

-- mls_agents_public
DROP VIEW IF EXISTS public.mls_agents_public;
CREATE VIEW public.mls_agents_public
  WITH (security_invoker = on)
AS
SELECT agent_key, full_name, first_name, last_name, office_key
FROM mls_agents;

-- mls_offices_public
DROP VIEW IF EXISTS public.mls_offices_public;
CREATE VIEW public.mls_offices_public
  WITH (security_invoker = on)
AS
SELECT id, office_key, office_mls_id, office_name, city, created_at, updated_at
FROM mls_offices;

-- mls_listings_safe
DROP VIEW IF EXISTS public.mls_listings_safe;
CREATE VIEW public.mls_listings_safe
  WITH (security_invoker = on)
AS
SELECT id, listing_key, listing_id, property_type, property_sub_type, mls_status, standard_status,
    listing_price, original_list_price, close_price, street_number, street_name, street_suffix,
    unit_number, city, state_or_province, postal_code, country, neighborhood, subdivision_name,
    unparsed_address, latitude, longitude, bedrooms_total, bathrooms_total, bathrooms_full,
    bathrooms_half, living_area, living_area_units, lot_size_area, lot_size_units, year_built,
    stories, parking_total, garage_spaces, waterfront_yn, pool_yn, photos, list_date,
    expiration_date, close_date, days_on_market, cumulative_days_on_market, association_fee,
    association_fee_frequency, tax_annual_amount, tax_year, heating, cooling, appliances,
    interior_features, exterior_features, community_features, view, public_remarks,
    virtual_tour_url, video_url, open_house_date, open_house_start_time, open_house_end_time,
    open_house_remarks, list_agent_key, list_agent_mls_id, list_agent_name, list_office_key,
    list_office_mls_id, list_office_name, buyer_agent_name, buyer_office_name, is_rental,
    lease_amount, lease_frequency, availability_date, pets_allowed, furnished, utilities_included,
    modification_timestamp, last_synced_at, created_at, updated_at, sync_status
FROM mls_listings
WHERE mls_status = ANY (ARRAY['Active'::text, 'Pending'::text]);

-- team_members_public
DROP VIEW IF EXISTS public.team_members_public;
CREATE VIEW public.team_members_public
  WITH (security_invoker = on)
AS
SELECT id, full_name, title, photo_url, bio, linkedin_url, instagram_url,
    specializations, sort_order, is_active, created_at, updated_at
FROM team_members
WHERE is_active = true;

-- Grant public read access on all views
GRANT SELECT ON public.mls_agents_public TO anon, authenticated;
GRANT SELECT ON public.mls_offices_public TO anon, authenticated;
GRANT SELECT ON public.mls_listings_safe TO anon, authenticated;
GRANT SELECT ON public.team_members_public TO anon, authenticated;