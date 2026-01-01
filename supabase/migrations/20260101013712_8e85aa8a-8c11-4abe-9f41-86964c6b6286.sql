-- Add lofty_tracking_webhook to the allowed public settings
DROP POLICY IF EXISTS "Public can read allowed settings only" ON public.app_settings;

CREATE POLICY "Public can read allowed settings only" 
ON public.app_settings 
FOR SELECT 
USING (key = ANY (ARRAY[
  'listing_price'::text, 
  'renewal_price'::text, 
  'featured_price'::text, 
  'whatsapp_number'::text,
  'lofty_tracking_webhook'::text
]));

-- Insert default empty value for lofty tracking webhook if it doesn't exist
INSERT INTO public.app_settings (key, value)
VALUES ('lofty_tracking_webhook', '""'::jsonb)
ON CONFLICT (key) DO NOTHING;