-- =============================================
-- CLIENT MANAGEMENT SYSTEM
-- IDX-style client tracking, saved searches, and property alerts
-- =============================================

-- Clients table (enhanced contacts with tracking)
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Optional: if client creates account
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  persona TEXT CHECK (persona IN ('buyer', 'investor', 'both')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'unsubscribed')),
  -- Source tracking
  source TEXT, -- lead_form, import, manual
  visitor_id TEXT,
  -- Preferences
  preferred_cities TEXT[],
  preferred_property_types TEXT[], -- condo, townhome, detached
  price_min INTEGER,
  price_max INTEGER,
  beds_min INTEGER,
  beds_max INTEGER,
  -- Drip campaign settings
  drip_enabled BOOLEAN DEFAULT true,
  drip_sequence TEXT DEFAULT 'buyer',
  last_drip_sent INTEGER DEFAULT 0,
  next_drip_at TIMESTAMP WITH TIME ZONE,
  -- Alert preferences
  alerts_enabled BOOLEAN DEFAULT true,
  alert_frequency TEXT DEFAULT 'daily' CHECK (alert_frequency IN ('instant', 'daily', 'weekly')),
  last_alert_sent_at TIMESTAMP WITH TIME ZONE,
  -- Activity tracking
  last_seen_at TIMESTAMP WITH TIME ZONE,
  last_email_opened_at TIMESTAMP WITH TIME ZONE,
  total_property_views INTEGER DEFAULT 0,
  total_site_visits INTEGER DEFAULT 0,
  intent_score INTEGER DEFAULT 0,
  -- Admin notes
  notes TEXT,
  tags TEXT[],
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT clients_email_unique UNIQUE (email)
);

-- Saved searches for property alerts
CREATE TABLE public.saved_searches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My Search',
  -- Search criteria
  cities TEXT[],
  neighborhoods TEXT[],
  property_types TEXT[], -- condo, townhome, detached
  listing_types TEXT[] DEFAULT ARRAY['resale', 'presale'], -- resale, presale, assignment
  price_min INTEGER,
  price_max INTEGER,
  beds_min INTEGER,
  beds_max INTEGER,
  baths_min INTEGER,
  year_built_min INTEGER,
  sqft_min INTEGER,
  sqft_max INTEGER,
  -- Alert settings
  is_active BOOLEAN DEFAULT true,
  alert_frequency TEXT DEFAULT 'daily' CHECK (alert_frequency IN ('instant', 'daily', 'weekly')),
  last_alert_at TIMESTAMP WITH TIME ZONE,
  -- Track what's been sent to avoid duplicates
  last_matched_listings TEXT[], -- array of listing_key or project_id
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Client activity log (page views, property views, etc.)
CREATE TABLE public.client_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  visitor_id TEXT, -- For anonymous tracking before client is identified
  -- Activity details
  activity_type TEXT NOT NULL, -- page_view, property_view, search, favorite, floorplan_view, form_submit, email_open, email_click
  -- Property context (if applicable)
  listing_key TEXT,
  project_id UUID,
  project_name TEXT,
  property_type TEXT,
  city TEXT,
  price INTEGER,
  -- Page context
  page_url TEXT,
  page_title TEXT,
  -- Duration tracking
  duration_seconds INTEGER,
  -- Source tracking
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  -- Device info
  device_type TEXT,
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Property alerts sent (to track what's been sent)
CREATE TABLE public.property_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  saved_search_id UUID REFERENCES public.saved_searches(id) ON DELETE SET NULL,
  alert_type TEXT NOT NULL, -- new_listing, price_change, back_on_market, open_house
  -- Property reference
  listing_key TEXT,
  project_id UUID,
  property_name TEXT,
  property_address TEXT,
  price INTEGER,
  previous_price INTEGER, -- For price change alerts
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'clicked')),
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_clients_email ON public.clients(email);
CREATE INDEX idx_clients_visitor_id ON public.clients(visitor_id);
CREATE INDEX idx_clients_status ON public.clients(status);
CREATE INDEX idx_clients_last_seen ON public.clients(last_seen_at);
CREATE INDEX idx_clients_alerts_enabled ON public.clients(alerts_enabled) WHERE alerts_enabled = true;

CREATE INDEX idx_saved_searches_client ON public.saved_searches(client_id);
CREATE INDEX idx_saved_searches_active ON public.saved_searches(is_active) WHERE is_active = true;

CREATE INDEX idx_client_activity_client ON public.client_activity(client_id);
CREATE INDEX idx_client_activity_visitor ON public.client_activity(visitor_id);
CREATE INDEX idx_client_activity_type ON public.client_activity(activity_type);
CREATE INDEX idx_client_activity_created ON public.client_activity(created_at DESC);
CREATE INDEX idx_client_activity_listing ON public.client_activity(listing_key);
CREATE INDEX idx_client_activity_project ON public.client_activity(project_id);

CREATE INDEX idx_property_alerts_client ON public.property_alerts(client_id);
CREATE INDEX idx_property_alerts_status ON public.property_alerts(status);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clients
-- Admins can do everything
CREATE POLICY "Admins can manage clients"
  ON public.clients FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Clients with accounts can view their own record
CREATE POLICY "Clients can view own record"
  ON public.clients FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Clients can update their own preferences
CREATE POLICY "Clients can update own preferences"
  ON public.clients FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for saved_searches
CREATE POLICY "Admins can manage saved_searches"
  ON public.saved_searches FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Clients can manage their own searches
CREATE POLICY "Clients can view own searches"
  ON public.saved_searches FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.clients c 
    WHERE c.id = saved_searches.client_id 
    AND c.user_id = auth.uid()
  ));

CREATE POLICY "Clients can create own searches"
  ON public.saved_searches FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.clients c 
    WHERE c.id = client_id 
    AND c.user_id = auth.uid()
  ));

CREATE POLICY "Clients can update own searches"
  ON public.saved_searches FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.clients c 
    WHERE c.id = saved_searches.client_id 
    AND c.user_id = auth.uid()
  ));

CREATE POLICY "Clients can delete own searches"
  ON public.saved_searches FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.clients c 
    WHERE c.id = saved_searches.client_id 
    AND c.user_id = auth.uid()
  ));

-- RLS Policies for client_activity
-- Admins can do everything
CREATE POLICY "Admins can manage client_activity"
  ON public.client_activity FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow anonymous insert for tracking (service role will insert)
CREATE POLICY "Allow activity tracking insert"
  ON public.client_activity FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Clients can view their own activity
CREATE POLICY "Clients can view own activity"
  ON public.client_activity FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.clients c 
    WHERE c.id = client_activity.client_id 
    AND c.user_id = auth.uid()
  ));

-- RLS Policies for property_alerts
CREATE POLICY "Admins can manage property_alerts"
  ON public.property_alerts FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Clients can view their own alerts
CREATE POLICY "Clients can view own alerts"
  ON public.property_alerts FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.clients c 
    WHERE c.id = property_alerts.client_id 
    AND c.user_id = auth.uid()
  ));

-- Trigger to update updated_at
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_saved_searches_updated_at
  BEFORE UPDATE ON public.saved_searches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();