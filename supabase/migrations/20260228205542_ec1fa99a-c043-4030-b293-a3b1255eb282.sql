
-- Create a public view for mls_listings that excludes agent-only private fields
CREATE OR REPLACE VIEW public.mls_listings_safe
WITH (security_invoker = on) AS
SELECT
  id, listing_key, listing_id, listing_price, original_list_price, close_price,
  mls_status, standard_status, property_type, property_sub_type,
  street_number, street_name, street_suffix, unit_number,
  city, state_or_province, postal_code, country, neighborhood, subdivision_name,
  unparsed_address,
  bedrooms_total, bathrooms_total, bathrooms_full, bathrooms_half,
  living_area, living_area_units, lot_size_area, lot_size_units,
  year_built, stories, parking_total, garage_spaces,
  latitude, longitude,
  photos, photos_change_timestamp,
  list_date, listing_contract_date, expiration_date, close_date,
  days_on_market, cumulative_days_on_market,
  association_fee, association_fee_frequency,
  tax_annual_amount, tax_year,
  public_remarks,
  -- private_remarks excluded from public view
  directions, virtual_tour_url, video_url,
  list_agent_key, list_agent_name, list_office_key, list_office_name, list_office_phone,
  -- list_agent_email and list_agent_phone excluded from public view
  list_agent_mls_id,
  buyer_agent_key, buyer_agent_name, buyer_office_name,
  waterfront_yn, pool_yn,
  open_house_date, open_house_start_time, open_house_end_time, open_house_remarks,
  exterior_features, community_features, view, interior_features,
  heating, cooling, appliances,
  is_rental, lease_amount, lease_frequency, availability_date,
  pets_allowed, furnished, utilities_included,
  modification_timestamp, last_synced_at, sync_status,
  created_at, updated_at
FROM public.mls_listings;
