-- Create enums
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.agent_verification_status AS ENUM ('unverified', 'verified', 'rejected');
CREATE TYPE public.listing_status AS ENUM ('draft', 'pending_payment', 'pending_approval', 'published', 'rejected', 'expired', 'paused');
CREATE TYPE public.property_type AS ENUM ('condo', 'townhouse', 'other');
CREATE TYPE public.unit_type AS ENUM ('studio', '1bed', '1bed_den', '2bed', '2bed_den', '3bed', 'penthouse');
CREATE TYPE public.construction_status AS ENUM ('pre_construction', 'under_construction', 'completed');

-- User profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Agent profiles table
CREATE TABLE public.agent_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  license_number TEXT NOT NULL,
  brokerage_name TEXT NOT NULL,
  brokerage_address TEXT,
  verification_status agent_verification_status NOT NULL DEFAULT 'unverified',
  verification_notes TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Listings table
CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status listing_status NOT NULL DEFAULT 'draft',
  
  -- Basic info
  title TEXT NOT NULL,
  project_name TEXT NOT NULL,
  developer_name TEXT,
  city TEXT NOT NULL,
  neighborhood TEXT,
  address TEXT,
  property_type property_type NOT NULL DEFAULT 'condo',
  unit_type unit_type NOT NULL DEFAULT '1bed',
  beds INTEGER NOT NULL DEFAULT 1,
  baths INTEGER NOT NULL DEFAULT 1,
  interior_sqft INTEGER,
  exterior_sqft INTEGER,
  floor_level INTEGER,
  exposure TEXT,
  
  -- Dates
  completion_month INTEGER,
  completion_year INTEGER,
  occupancy_date DATE,
  closing_date DATE,
  construction_status construction_status NOT NULL DEFAULT 'under_construction',
  
  -- Pricing
  assignment_price DECIMAL(12,2) NOT NULL,
  original_price DECIMAL(12,2),
  deposit_paid DECIMAL(12,2),
  assignment_fee DECIMAL(12,2),
  
  -- Features
  has_parking BOOLEAN DEFAULT false,
  parking_count INTEGER DEFAULT 0,
  has_storage BOOLEAN DEFAULT false,
  amenities TEXT[],
  description TEXT,
  
  -- Meta
  is_featured BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Listing photos
CREATE TABLE public.listing_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Listing files (floorplans, etc)
CREATE TABLE public.listing_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  file_type TEXT NOT NULL DEFAULT 'floorplan',
  url TEXT NOT NULL,
  file_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Leads table
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  stripe_payment_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'CAD',
  status TEXT NOT NULL DEFAULT 'pending',
  receipt_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- App settings for pricing
CREATE TABLE public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default listing price
INSERT INTO public.app_settings (key, value) VALUES ('listing_price', '{"amount": 99, "currency": "CAD"}');

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles RLS
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles RLS
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Agent profiles RLS
CREATE POLICY "Anyone can view verified agents" ON public.agent_profiles FOR SELECT USING (verification_status = 'verified');
CREATE POLICY "Agents can view own profile" ON public.agent_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Agents can insert own profile" ON public.agent_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Agents can update own profile" ON public.agent_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage agent profiles" ON public.agent_profiles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Listings RLS
CREATE POLICY "Anyone can view published listings" ON public.listings FOR SELECT USING (status = 'published');
CREATE POLICY "Agents can view own listings" ON public.listings FOR SELECT USING (auth.uid() = agent_id);
CREATE POLICY "Agents can insert own listings" ON public.listings FOR INSERT WITH CHECK (auth.uid() = agent_id);
CREATE POLICY "Agents can update own listings" ON public.listings FOR UPDATE USING (auth.uid() = agent_id);
CREATE POLICY "Agents can delete own listings" ON public.listings FOR DELETE USING (auth.uid() = agent_id);
CREATE POLICY "Admins can manage all listings" ON public.listings FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Listing photos RLS
CREATE POLICY "Anyone can view photos of published listings" ON public.listing_photos FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.listings WHERE id = listing_id AND status = 'published')
);
CREATE POLICY "Agents can manage own listing photos" ON public.listing_photos FOR ALL USING (
  EXISTS (SELECT 1 FROM public.listings WHERE id = listing_id AND agent_id = auth.uid())
);

-- Listing files RLS
CREATE POLICY "Anyone can view files of published listings" ON public.listing_files FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.listings WHERE id = listing_id AND status = 'published')
);
CREATE POLICY "Agents can manage own listing files" ON public.listing_files FOR ALL USING (
  EXISTS (SELECT 1 FROM public.listings WHERE id = listing_id AND agent_id = auth.uid())
);

-- Leads RLS
CREATE POLICY "Anyone can insert leads" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Agents can view own leads" ON public.leads FOR SELECT USING (auth.uid() = agent_id);
CREATE POLICY "Admins can view all leads" ON public.leads FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Payments RLS
CREATE POLICY "Agents can view own payments" ON public.payments FOR SELECT USING (auth.uid() = agent_id);
CREATE POLICY "Agents can insert own payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() = agent_id);
CREATE POLICY "Admins can manage all payments" ON public.payments FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- App settings RLS
CREATE POLICY "Anyone can read app settings" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage app settings" ON public.app_settings FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_agent_profiles_updated_at BEFORE UPDATE ON public.agent_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON public.listings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_listings_status ON public.listings(status);
CREATE INDEX idx_listings_city ON public.listings(city);
CREATE INDEX idx_listings_agent ON public.listings(agent_id);
CREATE INDEX idx_listings_featured ON public.listings(is_featured) WHERE is_featured = true;
CREATE INDEX idx_leads_agent ON public.leads(agent_id);
CREATE INDEX idx_leads_listing ON public.leads(listing_id);