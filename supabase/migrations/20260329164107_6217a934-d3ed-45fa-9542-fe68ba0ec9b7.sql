
-- 1. Composite index optimized for the map search query pattern
CREATE INDEX IF NOT EXISTS idx_mls_map_pins
ON public.mls_listings (mls_status, year_built, latitude, longitude)
WHERE mls_status = 'Active' AND latitude IS NOT NULL AND longitude IS NOT NULL;

-- 2. Lightweight RPC function returning only map-pin fields (no full photos JSON)
CREATE OR REPLACE FUNCTION public.get_map_pins(
  p_min_year int DEFAULT 2019,
  p_lat_min numeric DEFAULT 48.9,
  p_lat_max numeric DEFAULT 49.6,
  p_lng_min numeric DEFAULT -123.35,
  p_lng_max numeric DEFAULT -121.7,
  p_cities text[] DEFAULT NULL,
  p_min_beds int DEFAULT NULL,
  p_min_baths int DEFAULT NULL,
  p_min_sqft int DEFAULT NULL,
  p_max_sqft int DEFAULT NULL,
  p_min_price int DEFAULT NULL,
  p_max_price int DEFAULT NULL,
  p_listed_after date DEFAULT NULL,
  p_limit int DEFAULT 2000
)
RETURNS TABLE (
  id uuid,
  listing_key text,
  listing_price numeric,
  list_date date,
  city text,
  neighborhood text,
  street_number text,
  street_name text,
  street_suffix text,
  property_type text,
  property_sub_type text,
  bedrooms_total int,
  bathrooms_total numeric,
  living_area numeric,
  latitude numeric,
  longitude numeric,
  year_built int,
  list_agent_name text,
  list_office_name text,
  first_photo_url text
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    m.id,
    m.listing_key,
    m.listing_price,
    m.list_date,
    m.city,
    m.neighborhood,
    m.street_number,
    m.street_name,
    m.street_suffix,
    m.property_type,
    m.property_sub_type,
    m.bedrooms_total,
    m.bathrooms_total,
    m.living_area,
    m.latitude,
    m.longitude,
    m.year_built,
    m.list_agent_name,
    m.list_office_name,
    -- Extract first photo URL server-side instead of sending entire JSON array
    (m.photos -> 0 ->> 'MediaURL')::text AS first_photo_url
  FROM mls_listings m
  WHERE m.mls_status = 'Active'
    AND m.latitude IS NOT NULL
    AND m.longitude IS NOT NULL
    AND m.year_built >= p_min_year
    AND m.latitude BETWEEN p_lat_min AND p_lat_max
    AND m.longitude BETWEEN p_lng_min AND p_lng_max
    AND (p_cities IS NULL OR m.city = ANY(p_cities))
    AND (p_min_beds IS NULL OR m.bedrooms_total >= p_min_beds)
    AND (p_min_baths IS NULL OR m.bathrooms_total >= p_min_baths)
    AND (p_min_sqft IS NULL OR m.living_area >= p_min_sqft)
    AND (p_max_sqft IS NULL OR m.living_area <= p_max_sqft)
    AND (p_min_price IS NULL OR m.listing_price >= p_min_price)
    AND (p_max_price IS NULL OR m.listing_price <= p_max_price)
    AND (p_listed_after IS NULL OR m.list_date >= p_listed_after)
  ORDER BY m.list_date DESC NULLS LAST, m.listing_price DESC
  LIMIT p_limit;
$$;

-- Grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION public.get_map_pins TO anon, authenticated;
