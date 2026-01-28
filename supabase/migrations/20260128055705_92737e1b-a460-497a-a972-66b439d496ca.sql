-- Add rental-specific fields to mls_listings table
ALTER TABLE public.mls_listings 
ADD COLUMN IF NOT EXISTS lease_amount numeric NULL,
ADD COLUMN IF NOT EXISTS lease_frequency text NULL,
ADD COLUMN IF NOT EXISTS is_rental boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS availability_date date NULL,
ADD COLUMN IF NOT EXISTS pets_allowed text NULL,
ADD COLUMN IF NOT EXISTS furnished text NULL,
ADD COLUMN IF NOT EXISTS utilities_included text[] NULL;

-- Create index for rental queries
CREATE INDEX IF NOT EXISTS idx_mls_listings_is_rental ON public.mls_listings(is_rental) WHERE is_rental = true;
CREATE INDEX IF NOT EXISTS idx_mls_listings_lease_amount ON public.mls_listings(lease_amount) WHERE lease_amount IS NOT NULL;

-- Add rental settings to app_settings visibility
-- Update the RLS policy to include rental settings
DROP POLICY IF EXISTS "Public can read allowed settings only" ON public.app_settings;
CREATE POLICY "Public can read allowed settings only" 
ON public.app_settings 
FOR SELECT 
USING (key = ANY (ARRAY[
  'listing_price'::text, 
  'renewal_price'::text, 
  'featured_price'::text, 
  'whatsapp_number'::text, 
  'lofty_tracking_webhook'::text, 
  'mls_enabled_cities'::text, 
  'resale_min_year_built'::text,
  'rental_enabled_cities'::text,
  'rental_min_lease'::text,
  'rental_max_lease'::text
]));