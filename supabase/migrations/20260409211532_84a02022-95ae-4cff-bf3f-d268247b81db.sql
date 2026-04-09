ALTER TABLE public.campaign_templates ADD COLUMN tags text[] DEFAULT '{}';
CREATE INDEX idx_campaign_templates_tags ON public.campaign_templates USING GIN(tags);