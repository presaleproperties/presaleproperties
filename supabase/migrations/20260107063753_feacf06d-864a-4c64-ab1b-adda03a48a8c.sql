-- Add latitude and longitude columns to listings table for map pins
ALTER TABLE public.listings
ADD COLUMN map_lat numeric NULL,
ADD COLUMN map_lng numeric NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.listings.map_lat IS 'Latitude coordinate for map pin';
COMMENT ON COLUMN public.listings.map_lng IS 'Longitude coordinate for map pin';