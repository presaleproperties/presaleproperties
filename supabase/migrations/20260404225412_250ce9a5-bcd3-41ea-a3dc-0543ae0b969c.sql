ALTER TABLE public.onboarded_leads
ADD COLUMN template_id UUID REFERENCES public.campaign_templates(id) ON DELETE SET NULL;