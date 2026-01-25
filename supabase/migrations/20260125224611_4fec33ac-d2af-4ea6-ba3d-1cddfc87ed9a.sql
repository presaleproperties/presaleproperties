-- Update RLS policy to allow public read of resale_min_year_built setting
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
  'resale_min_year_built'::text
]));

-- Insert default value if it doesn't exist (cast as jsonb)
INSERT INTO public.app_settings (key, value)
VALUES ('resale_min_year_built', to_jsonb(2024))
ON CONFLICT (key) DO NOTHING;