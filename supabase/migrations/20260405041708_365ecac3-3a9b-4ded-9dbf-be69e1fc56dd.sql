-- Add user_id column to campaign_templates
ALTER TABLE public.campaign_templates
ADD COLUMN user_id uuid DEFAULT NULL;

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage campaign templates" ON public.campaign_templates;
DROP POLICY IF EXISTS "Authenticated users can view campaign templates" ON public.campaign_templates;

-- Admins can do everything
CREATE POLICY "Admins can manage campaign templates"
ON public.campaign_templates
FOR ALL
TO public
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Agents can view their own templates + admin templates (user_id IS NULL)
CREATE POLICY "Agents can view own and shared templates"
ON public.campaign_templates
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR user_id IS NULL);

-- Agents can insert their own templates
CREATE POLICY "Agents can insert own templates"
ON public.campaign_templates
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Agents can update their own templates
CREATE POLICY "Agents can update own templates"
ON public.campaign_templates
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Agents can delete their own templates
CREATE POLICY "Agents can delete own templates"
ON public.campaign_templates
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);