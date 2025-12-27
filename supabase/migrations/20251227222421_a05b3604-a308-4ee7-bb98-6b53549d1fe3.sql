-- Update the public read policy to include whatsapp_number
DROP POLICY IF EXISTS "Public can read allowed settings only" ON public.app_settings;

CREATE POLICY "Public can read allowed settings only" 
ON public.app_settings 
FOR SELECT 
USING (key = ANY (ARRAY['listing_price', 'whatsapp_number']));