
CREATE TABLE public.onboarded_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  source TEXT NOT NULL DEFAULT 'other',
  notes TEXT DEFAULT '',
  deck_id UUID REFERENCES public.pitch_decks(id) ON DELETE SET NULL,
  deck_url TEXT DEFAULT '',
  zapier_synced BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.onboarded_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own onboarded leads"
  ON public.onboarded_leads FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own onboarded leads"
  ON public.onboarded_leads FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all onboarded leads"
  ON public.onboarded_leads FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_onboarded_leads_updated_at
  BEFORE UPDATE ON public.onboarded_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
