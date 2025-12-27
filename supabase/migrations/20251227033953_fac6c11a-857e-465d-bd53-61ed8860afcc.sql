-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can read app settings" ON public.app_settings;

-- Create a more restrictive policy that only allows public access to specific safe settings
-- like listing_price which needs to be shown on the payment page
CREATE POLICY "Public can read allowed settings only" 
ON public.app_settings 
FOR SELECT 
USING (key = ANY(ARRAY['listing_price']));