-- Create buyer_profiles table for VIP members
CREATE TABLE public.buyer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  phone TEXT,
  phone_verified BOOLEAN DEFAULT false,
  full_name TEXT,
  buyer_type TEXT CHECK (buyer_type IN ('first_time', 'investor', 'upgrader', 'downsizer')),
  budget_min INTEGER,
  budget_max INTEGER,
  preferred_cities TEXT[] DEFAULT '{}',
  preferred_bedrooms INTEGER[],
  timeline TEXT CHECK (timeline IN ('0-3', '3-6', '6-12', '12+')),
  is_vip BOOLEAN DEFAULT true,
  vip_joined_at TIMESTAMPTZ DEFAULT now(),
  alerts_enabled BOOLEAN DEFAULT true,
  alert_frequency TEXT DEFAULT 'weekly' CHECK (alert_frequency IN ('instant', 'daily', 'weekly')),
  last_alert_sent_at TIMESTAMPTZ,
  drip_sequence_step INTEGER DEFAULT 0,
  next_drip_at TIMESTAMPTZ,
  visitor_id TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create saved_projects table for buyer favorites
CREATE TABLE public.saved_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES public.buyer_profiles(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.presale_projects(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(buyer_id, project_id)
);

-- Create project_alerts table for tracking sent alerts
CREATE TABLE public.project_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES public.buyer_profiles(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.presale_projects(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('new_project', 'price_update', 'coming_soon', 'now_selling')),
  sent_at TIMESTAMPTZ DEFAULT now(),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ
);

-- Create buyer_drip_emails table for tracking email sequence
CREATE TABLE public.buyer_drip_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES public.buyer_profiles(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL CHECK (email_type IN ('welcome', 'vip_benefits', 'project_recommendations', 'market_update', 'exclusive_access')),
  sent_at TIMESTAMPTZ DEFAULT now(),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.buyer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_drip_emails ENABLE ROW LEVEL SECURITY;

-- Buyer profiles: users can only see/edit their own
CREATE POLICY "Users can view own buyer profile"
  ON public.buyer_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own buyer profile"
  ON public.buyer_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own buyer profile"
  ON public.buyer_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can manage all buyer profiles
CREATE POLICY "Admins can view all buyer profiles"
  ON public.buyer_profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all buyer profiles"
  ON public.buyer_profiles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Saved projects: users can only manage their own
CREATE POLICY "Users can view own saved projects"
  ON public.saved_projects FOR SELECT
  USING (
    buyer_id IN (
      SELECT id FROM public.buyer_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own saved projects"
  ON public.saved_projects FOR INSERT
  WITH CHECK (
    buyer_id IN (
      SELECT id FROM public.buyer_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own saved projects"
  ON public.saved_projects FOR DELETE
  USING (
    buyer_id IN (
      SELECT id FROM public.buyer_profiles WHERE user_id = auth.uid()
    )
  );

-- Project alerts: users can view their own, admins can manage all
CREATE POLICY "Users can view own project alerts"
  ON public.project_alerts FOR SELECT
  USING (
    buyer_id IN (
      SELECT id FROM public.buyer_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage project alerts"
  ON public.project_alerts FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Drip emails: service role only (edge functions)
CREATE POLICY "Admins can view drip emails"
  ON public.buyer_drip_emails FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Create indexes for performance
CREATE INDEX idx_buyer_profiles_user_id ON public.buyer_profiles(user_id);
CREATE INDEX idx_buyer_profiles_email ON public.buyer_profiles(email);
CREATE INDEX idx_buyer_profiles_is_vip ON public.buyer_profiles(is_vip);
CREATE INDEX idx_saved_projects_buyer_id ON public.saved_projects(buyer_id);
CREATE INDEX idx_saved_projects_project_id ON public.saved_projects(project_id);
CREATE INDEX idx_project_alerts_buyer_id ON public.project_alerts(buyer_id);
CREATE INDEX idx_buyer_drip_emails_buyer_id ON public.buyer_drip_emails(buyer_id);

-- Trigger for updated_at
CREATE TRIGGER update_buyer_profiles_updated_at
  BEFORE UPDATE ON public.buyer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();