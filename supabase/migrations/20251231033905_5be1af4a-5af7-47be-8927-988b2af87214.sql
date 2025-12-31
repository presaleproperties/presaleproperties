-- Update RLS policy to allow admins to read zapier webhook settings
DROP POLICY IF EXISTS "Public can read allowed settings only" ON public.app_settings;

CREATE POLICY "Public can read allowed settings only" 
ON public.app_settings 
FOR SELECT 
USING (key = ANY (ARRAY['listing_price'::text, 'renewal_price'::text, 'featured_price'::text, 'whatsapp_number'::text]));

-- Service role can read all settings (for edge functions)
-- This is already handled by service role key bypassing RLS