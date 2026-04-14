-- Add back non-sensitive reference keys to the safe view
DROP VIEW IF EXISTS public.mls_listings_safe;

CREATE VIEW public.mls_listings_safe
WITH (security_invoker = true)
AS SELECT 
    id, listing_key, listing_id, listing_price, original_list_price,
    mls_status, standard_status, property_type, property_sub_type,
    city, neighborhood, subdivision_name,
    street_number, street_name, street_suffix, unit_number, unparsed_address,
    postal_code, state_or_province, country,
    bedrooms_total, bathrooms_total, bathrooms_full, bathrooms_half,
    living_area, living_area_units, lot_size_area, lot_size_units,
    stories, year_built, garage_spaces, parking_total,
    latitude, longitude,
    list_date, listing_contract_date, close_date, close_price, expiration_date,
    days_on_market, cumulative_days_on_market,
    photos, photos_change_timestamp, virtual_tour_url, video_url,
    public_remarks, directions,
    -- Non-sensitive reference keys for lookups
    list_agent_key, list_agent_mls_id, list_agent_name,
    list_office_key, list_office_mls_id, list_office_name,
    -- Buyer agent name/office (public MLS data, not contact info)
    buyer_agent_key, buyer_agent_name, buyer_office_name,
    association_fee, association_fee_frequency,
    tax_annual_amount, tax_year,
    pool_yn, waterfront_yn,
    heating, cooling, appliances,
    interior_features, exterior_features, community_features,
    view, utilities_included, furnished, pets_allowed,
    is_rental, lease_amount, lease_frequency, availability_date,
    open_house_date, open_house_start_time, open_house_end_time, open_house_remarks,
    modification_timestamp, last_synced_at, sync_status,
    created_at, updated_at
FROM mls_listings
WHERE mls_status = ANY (ARRAY['Active'::text, 'Pending'::text]);

GRANT SELECT ON public.mls_listings_safe TO anon, authenticated;