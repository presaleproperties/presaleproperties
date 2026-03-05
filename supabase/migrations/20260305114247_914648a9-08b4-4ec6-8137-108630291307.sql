
-- Create the listings table for assignment listings tied to presale projects
CREATE TABLE public.listings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Link to presale project (required for assignments)
  project_id uuid REFERENCES public.presale_projects(id) ON DELETE SET NULL,

  -- Agent who submitted (optional)
  agent_id uuid,

  -- Basic info (auto-populated from project)
  title text NOT NULL DEFAULT '',
  project_name text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  neighborhood text,
  address text,
  developer_name text,

  -- Unit-specific details
  unit_number text,
  floor_level integer,
  unit_type text,
  beds integer NOT NULL DEFAULT 0,
  baths numeric NOT NULL DEFAULT 0,
  interior_sqft integer,
  exterior_sqft integer,
  exposure text,
  parking text,
  has_locker boolean NOT NULL DEFAULT false,

  -- Floor plan
  floor_plan_url text,
  floor_plan_name text,

  -- Dates
  estimated_completion text,
  original_completion_year integer,

  -- Pricing
  assignment_price numeric NOT NULL DEFAULT 0,
  original_price numeric,
  deposit_to_lock numeric,
  buyer_agent_commission text,

  -- Flags
  developer_approval_required boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending_approval',
  is_featured boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,

  -- Content
  description text,
  highlights text[],
  photos text[],
  featured_image text,

  -- Attribution
  rejection_reason text,
  published_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage listings"
  ON public.listings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view published listings"
  ON public.listings FOR SELECT
  USING (status = 'published');

CREATE POLICY "Agents can insert own listings"
  ON public.listings FOR INSERT
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Agents can update own pending listings"
  ON public.listings FOR UPDATE
  USING (agent_id = auth.uid() AND status IN ('pending_approval', 'rejected'));

CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_listings_project_id ON public.listings(project_id);
CREATE INDEX idx_listings_status ON public.listings(status);
CREATE INDEX idx_listings_agent_id ON public.listings(agent_id);
CREATE INDEX idx_listings_city ON public.listings(city);
