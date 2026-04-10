
CREATE TABLE public.crm_showings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  lead_name TEXT NOT NULL,
  lead_phone TEXT DEFAULT '',
  lead_email TEXT DEFAULT '',
  project_name TEXT DEFAULT '',
  property_address TEXT DEFAULT '',
  showing_date DATE NOT NULL,
  showing_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'Scheduled',
  assigned_agent TEXT DEFAULT 'Uzair Muhammad',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_showings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and agents can view showings"
  ON public.crm_showings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'agent'));

CREATE POLICY "Admins and agents can insert showings"
  ON public.crm_showings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'agent'));

CREATE POLICY "Admins and agents can update showings"
  ON public.crm_showings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'agent'));

CREATE POLICY "Admins and agents can delete showings"
  ON public.crm_showings FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'agent'));

CREATE TRIGGER update_crm_showings_updated_at
  BEFORE UPDATE ON public.crm_showings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
