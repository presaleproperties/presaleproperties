
-- 1. Create a public-safe view for MLS listings excluding private_remarks and raw_data
CREATE OR REPLACE VIEW public.mls_listings_public AS
SELECT
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
  list_agent_key, list_agent_mls_id, list_agent_name, list_agent_email, list_agent_phone,
  list_office_key, list_office_mls_id, list_office_name, list_office_phone,
  buyer_agent_key, buyer_agent_name, buyer_office_name,
  association_fee, association_fee_frequency,
  tax_annual_amount, tax_year,
  pool_yn, waterfront_yn,
  heating, cooling, appliances,
  interior_features, exterior_features, community_features,
  view, utilities_included,
  furnished, pets_allowed, is_rental,
  lease_amount, lease_frequency, availability_date,
  open_house_date, open_house_start_time, open_house_end_time, open_house_remarks,
  modification_timestamp, last_synced_at, sync_status,
  created_at, updated_at
FROM public.mls_listings
WHERE mls_status = ANY (ARRAY['Active', 'Pending']);

GRANT SELECT ON public.mls_listings_public TO anon, authenticated;

-- Drop old public SELECT policy that exposes private_remarks
DROP POLICY IF EXISTS "Public can read active listings" ON public.mls_listings;

-- 2. Remove off_market_inquiries from Realtime
ALTER PUBLICATION supabase_realtime DROP TABLE public.off_market_inquiries;

-- 3. Drop open anonymous INSERT on client_activity
DROP POLICY IF EXISTS "Allow activity tracking insert" ON public.client_activity;

-- 4. Drop header-spoofable project_leads UPDATE policy
DROP POLICY IF EXISTS "Submitter can update own recent project lead" ON public.project_leads;

-- 5. Restrict off-market storage to admins only
DROP POLICY IF EXISTS "Authenticated upload off-market-pricing" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update off-market-pricing" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete off-market-pricing" ON storage.objects;
DROP POLICY IF EXISTS "Public read off-market-pricing" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload off-market-floorplans" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update off-market-floorplans" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete off-market-floorplans" ON storage.objects;
DROP POLICY IF EXISTS "Public read off-market-floorplans" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload off-market-photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update off-market-photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete off-market-photos" ON storage.objects;
DROP POLICY IF EXISTS "Public read off-market-photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload developer-logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update developer-logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete developer-logos" ON storage.objects;

CREATE POLICY "Admins can upload off-market-pricing" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'off-market-pricing' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update off-market-pricing" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'off-market-pricing' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete off-market-pricing" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'off-market-pricing' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can read off-market-pricing" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'off-market-pricing' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can upload off-market-floorplans" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'off-market-floorplans' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update off-market-floorplans" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'off-market-floorplans' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete off-market-floorplans" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'off-market-floorplans' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can read off-market-floorplans" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'off-market-floorplans' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can upload off-market-photos" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'off-market-photos' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update off-market-photos" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'off-market-photos' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete off-market-photos" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'off-market-photos' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can read off-market-photos" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'off-market-photos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can upload developer-logos" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'developer-logos' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update developer-logos" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'developer-logos' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete developer-logos" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'developer-logos' AND has_role(auth.uid(), 'admin'::app_role));

-- Make off-market buckets private
UPDATE storage.buckets SET public = false WHERE id IN ('off-market-pricing', 'off-market-floorplans', 'off-market-photos');
