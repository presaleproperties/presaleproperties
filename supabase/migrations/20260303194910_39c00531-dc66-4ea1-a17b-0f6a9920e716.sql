
CREATE TABLE public.campaign_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  project_name text NOT NULL DEFAULT '',
  thumbnail_url text,
  form_data jsonb NOT NULL DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.campaign_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage campaign templates"
  ON public.campaign_templates FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_campaign_templates_updated_at
  BEFORE UPDATE ON public.campaign_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
