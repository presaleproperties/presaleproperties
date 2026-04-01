
-- 1. Add listing_type to listings table
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS listing_type text NOT NULL DEFAULT 'assignment';

CREATE INDEX IF NOT EXISTS idx_listings_listing_type ON public.listings (listing_type);

-- 2. Create developer_project_access FIRST (referenced by off_market_batches policy)
CREATE TABLE IF NOT EXISTS public.developer_project_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_profile_id uuid NOT NULL REFERENCES public.developer_profiles(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.presale_projects(id) ON DELETE CASCADE,
  granted_at timestamptz NOT NULL DEFAULT now(),
  granted_by uuid NULL,
  UNIQUE (developer_profile_id, project_id)
);

ALTER TABLE public.developer_project_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage developer_project_access"
  ON public.developer_project_access FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Developers can view own access"
  ON public.developer_project_access FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.developer_profiles dp
      WHERE dp.id = developer_project_access.developer_profile_id
        AND dp.user_id = auth.uid()
    )
  );

-- 3. Create off_market_batches table
CREATE TABLE IF NOT EXISTS public.off_market_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.presale_projects(id) ON DELETE CASCADE,
  incentives text NULL,
  deposit_structure text NULL,
  parking_included boolean DEFAULT false,
  ac_included boolean DEFAULT false,
  admin_notes text NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.off_market_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage off_market_batches"
  ON public.off_market_batches FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Developers can view batches for their projects"
  ON public.off_market_batches FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.developer_project_access dpa
      JOIN public.developer_profiles dp ON dp.id = dpa.developer_profile_id
      WHERE dpa.project_id = off_market_batches.project_id
        AND dp.user_id = auth.uid()
    )
  );

CREATE TRIGGER update_off_market_batches_updated_at
  BEFORE UPDATE ON public.off_market_batches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Create off_market_access table (buyer whitelisting)
CREATE TABLE IF NOT EXISTS public.off_market_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_profile_id uuid NOT NULL REFERENCES public.buyer_profiles(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.presale_projects(id) ON DELETE CASCADE,
  granted_at timestamptz NOT NULL DEFAULT now(),
  granted_by uuid NULL,
  UNIQUE (buyer_profile_id, project_id)
);

ALTER TABLE public.off_market_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage off_market_access"
  ON public.off_market_access FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Buyers can view own access"
  ON public.off_market_access FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.buyer_profiles bp
      WHERE bp.id = off_market_access.buyer_profile_id
        AND bp.user_id = auth.uid()
    )
  );
