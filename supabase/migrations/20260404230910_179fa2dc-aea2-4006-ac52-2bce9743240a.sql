CREATE POLICY "Authenticated users can view campaign templates"
ON public.campaign_templates
FOR SELECT
TO authenticated
USING (true);