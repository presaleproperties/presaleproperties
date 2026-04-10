-- Campaign bundles for 12-week email sequences
CREATE TABLE public.campaign_bundles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  primary_project_id UUID NOT NULL,
  alt_project_1_id UUID NOT NULL,
  alt_project_2_id UUID NOT NULL,
  user_id UUID,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campaign_bundles ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins can manage campaign bundles"
ON public.campaign_bundles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Agents can manage own bundles
CREATE POLICY "Users can view own bundles"
ON public.campaign_bundles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create own bundles"
ON public.campaign_bundles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own bundles"
ON public.campaign_bundles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own bundles"
ON public.campaign_bundles
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Timestamp trigger
CREATE TRIGGER update_campaign_bundles_updated_at
BEFORE UPDATE ON public.campaign_bundles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();