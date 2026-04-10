
CREATE TABLE public.crm_email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT '',
  html_content TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  recipients_group TEXT DEFAULT 'All Leads',
  recipients_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_email_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and agents can view campaigns"
  ON public.crm_email_campaigns FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'agent'));

CREATE POLICY "Admins and agents can insert campaigns"
  ON public.crm_email_campaigns FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'agent'));

CREATE POLICY "Admins and agents can update campaigns"
  ON public.crm_email_campaigns FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'agent'));

CREATE POLICY "Admins and agents can delete campaigns"
  ON public.crm_email_campaigns FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'agent'));

CREATE TRIGGER update_crm_email_campaigns_updated_at
  BEFORE UPDATE ON public.crm_email_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
