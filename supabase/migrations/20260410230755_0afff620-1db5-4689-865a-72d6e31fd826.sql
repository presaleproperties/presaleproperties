
-- Create CRM leads table
CREATE TABLE public.crm_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  buyer_type TEXT,
  source TEXT,
  pipeline_status TEXT NOT NULL DEFAULT 'New Lead',
  temperature TEXT NOT NULL DEFAULT 'warm',
  tags TEXT[],
  assigned_agent TEXT DEFAULT 'Uzair Muhammad',
  budget_min INTEGER,
  budget_max INTEGER,
  project_interest TEXT[],
  area_interest TEXT[],
  notes TEXT,
  last_contacted_at TIMESTAMPTZ,
  next_followup_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;

-- Only admins and agents can access CRM leads
CREATE POLICY "Admins can manage all CRM leads"
ON public.crm_leads FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents can manage all CRM leads"
ON public.crm_leads FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'agent'))
WITH CHECK (public.has_role(auth.uid(), 'agent'));

-- Auto-update updated_at
CREATE TRIGGER update_crm_leads_updated_at
BEFORE UPDATE ON public.crm_leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
