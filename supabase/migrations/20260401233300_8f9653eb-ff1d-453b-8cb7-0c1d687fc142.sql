
-- ============================================
-- 1. Extend developers table with missing columns
-- ============================================
ALTER TABLE public.developers
  ADD COLUMN IF NOT EXISTS contact_name text,
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS cities_active text[] DEFAULT '{}';

-- ============================================
-- 2. Drop old off_market_access (0 rows, wrong schema)
-- ============================================
DROP TABLE IF EXISTS public.off_market_access;

-- ============================================
-- 3. Create off_market_listings
-- ============================================
CREATE TABLE public.off_market_listings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  linked_project_slug text NOT NULL,
  linked_project_name text NOT NULL,
  developer_id uuid REFERENCES public.developers(id),
  developer_name text,
  status text DEFAULT 'draft',
  access_level text DEFAULT 'teaser',
  auto_approve_access boolean DEFAULT false,
  pricing_sheet_url text,
  brochure_url text,
  info_sheet_url text,
  deposit_structure text,
  deposit_percentage numeric,
  incentives text,
  incentive_expiry date,
  vip_incentives text,
  parking_type text,
  parking_included boolean DEFAULT false,
  parking_cost numeric,
  storage_included boolean DEFAULT false,
  storage_cost numeric,
  storage_size text,
  locker_included boolean DEFAULT false,
  locker_cost numeric,
  completion_date text,
  construction_stage text,
  assignment_allowed boolean DEFAULT false,
  assignment_fee text,
  available_upgrades jsonb DEFAULT '[]',
  additional_notes text,
  photo_urls text[] DEFAULT '{}',
  floorplan_urls text[] DEFAULT '{}',
  total_units int DEFAULT 0,
  available_units int DEFAULT 0,
  view_count int DEFAULT 0,
  unlock_request_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  published_at timestamptz
);

-- Validation trigger for status
CREATE OR REPLACE FUNCTION public.validate_off_market_listing_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status NOT IN ('draft','pending_review','published','archived') THEN
    RAISE EXCEPTION 'Invalid listing status: %', NEW.status;
  END IF;
  IF NEW.access_level NOT IN ('public','teaser','approved_only','vip_only') THEN
    RAISE EXCEPTION 'Invalid access level: %', NEW.access_level;
  END IF;
  IF NEW.construction_stage IS NOT NULL AND NEW.construction_stage NOT IN ('pre-construction','excavation','foundation','framing','finishing','move-in-ready') THEN
    RAISE EXCEPTION 'Invalid construction stage: %', NEW.construction_stage;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_off_market_listing
BEFORE INSERT OR UPDATE ON public.off_market_listings
FOR EACH ROW EXECUTE FUNCTION public.validate_off_market_listing_status();

-- RLS
ALTER TABLE public.off_market_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published off-market listings"
ON public.off_market_listings FOR SELECT
USING (status = 'published');

CREATE POLICY "Admins can manage all off-market listings"
ON public.off_market_listings FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Developers can manage own off-market listings"
ON public.off_market_listings FOR ALL
TO authenticated
USING (
  developer_id IN (
    SELECT d.id FROM public.developers d
    JOIN public.developer_profiles dp ON dp.company_name = d.name
    WHERE dp.user_id = auth.uid() AND dp.verification_status = 'approved'
  )
)
WITH CHECK (
  developer_id IN (
    SELECT d.id FROM public.developers d
    JOIN public.developer_profiles dp ON dp.company_name = d.name
    WHERE dp.user_id = auth.uid() AND dp.verification_status = 'approved'
  )
);

-- ============================================
-- 4. Create off_market_units
-- ============================================
CREATE TABLE public.off_market_units (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id uuid REFERENCES public.off_market_listings(id) ON DELETE CASCADE,
  developer_id uuid REFERENCES public.developers(id),
  unit_number text NOT NULL,
  unit_name text,
  unit_type text,
  floor_level int,
  bedrooms int NOT NULL,
  bathrooms numeric NOT NULL,
  sqft numeric NOT NULL,
  price numeric NOT NULL,
  price_per_sqft numeric GENERATED ALWAYS AS (ROUND(price / NULLIF(sqft, 0), 2)) STORED,
  parking_included boolean DEFAULT false,
  parking_type text,
  storage_included boolean DEFAULT false,
  storage_type text,
  locker_included boolean DEFAULT false,
  inclusions text[] DEFAULT '{}',
  available_upgrades jsonb DEFAULT '[]',
  orientation text,
  view_type text,
  floorplan_url text,
  floorplan_thumbnail_url text,
  photo_urls text[] DEFAULT '{}',
  has_unit_incentive boolean DEFAULT false,
  unit_incentive text,
  status text DEFAULT 'available',
  sold_at timestamptz,
  reserved_at timestamptz,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Validation triggers for units
CREATE OR REPLACE FUNCTION public.validate_off_market_unit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sqft <= 0 THEN
    RAISE EXCEPTION 'sqft must be greater than 0';
  END IF;
  IF NEW.price <= 0 THEN
    RAISE EXCEPTION 'price must be greater than 0';
  END IF;
  IF NEW.unit_type IS NOT NULL AND NEW.unit_type NOT IN ('Studio','1BR','1BR+Den','2BR','2BR+Den','3BR','3BR+Den','Townhome','Penthouse','Other') THEN
    RAISE EXCEPTION 'Invalid unit type: %', NEW.unit_type;
  END IF;
  IF NEW.status NOT IN ('available','reserved','sold','hold') THEN
    RAISE EXCEPTION 'Invalid unit status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_off_market_unit_trigger
BEFORE INSERT OR UPDATE ON public.off_market_units
FOR EACH ROW EXECUTE FUNCTION public.validate_off_market_unit();

-- RLS
ALTER TABLE public.off_market_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read units of published listings"
ON public.off_market_units FOR SELECT
USING (
  listing_id IN (SELECT id FROM public.off_market_listings WHERE status = 'published')
);

CREATE POLICY "Admins can manage all off-market units"
ON public.off_market_units FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Developers can manage own off-market units"
ON public.off_market_units FOR ALL
TO authenticated
USING (
  developer_id IN (
    SELECT d.id FROM public.developers d
    JOIN public.developer_profiles dp ON dp.company_name = d.name
    WHERE dp.user_id = auth.uid() AND dp.verification_status = 'approved'
  )
)
WITH CHECK (
  developer_id IN (
    SELECT d.id FROM public.developers d
    JOIN public.developer_profiles dp ON dp.company_name = d.name
    WHERE dp.user_id = auth.uid() AND dp.verification_status = 'approved'
  )
);

-- ============================================
-- 5. Create off_market_access (rebuilt)
-- ============================================
CREATE TABLE public.off_market_access (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id uuid REFERENCES public.off_market_listings(id),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  has_agent boolean DEFAULT false,
  budget_range text,
  timeline text,
  message text,
  status text DEFAULT 'pending',
  approved_at timestamptz,
  approved_by text,
  lead_id uuid,
  source text DEFAULT 'off_market_page',
  created_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.validate_off_market_access_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status NOT IN ('pending','approved','denied') THEN
    RAISE EXCEPTION 'Invalid access status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_off_market_access_trigger
BEFORE INSERT OR UPDATE ON public.off_market_access
FOR EACH ROW EXECUTE FUNCTION public.validate_off_market_access_status();

-- RLS
ALTER TABLE public.off_market_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit access requests"
ON public.off_market_access FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can manage all access requests"
ON public.off_market_access FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- 6. Create off_market_analytics
-- ============================================
CREATE TABLE public.off_market_analytics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id uuid REFERENCES public.off_market_listings(id),
  unit_id uuid REFERENCES public.off_market_units(id),
  event_type text NOT NULL,
  visitor_id text,
  device text,
  referrer text,
  created_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.validate_off_market_analytics_event()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.event_type NOT IN ('page_view','listing_view','unlock_request','unit_view','floorplan_download','pricing_download','whatsapp_click','call_click','inquiry_submit') THEN
    RAISE EXCEPTION 'Invalid event type: %', NEW.event_type;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_off_market_analytics_trigger
BEFORE INSERT OR UPDATE ON public.off_market_analytics
FOR EACH ROW EXECUTE FUNCTION public.validate_off_market_analytics_event();

-- RLS
ALTER TABLE public.off_market_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert analytics events"
ON public.off_market_analytics FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all analytics"
ON public.off_market_analytics FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- 7. Auto-update unit counts trigger
-- ============================================
CREATE OR REPLACE FUNCTION public.update_listing_unit_counts()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.off_market_listings
  SET
    total_units = (SELECT COUNT(*) FROM public.off_market_units WHERE listing_id = COALESCE(NEW.listing_id, OLD.listing_id)),
    available_units = (SELECT COUNT(*) FROM public.off_market_units WHERE listing_id = COALESCE(NEW.listing_id, OLD.listing_id) AND status = 'available'),
    updated_at = now()
  WHERE id = COALESCE(NEW.listing_id, OLD.listing_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_update_listing_counts
AFTER INSERT OR UPDATE OR DELETE ON public.off_market_units
FOR EACH ROW EXECUTE FUNCTION public.update_listing_unit_counts();

-- ============================================
-- 8. Updated_at triggers
-- ============================================
CREATE TRIGGER update_off_market_listings_updated_at
BEFORE UPDATE ON public.off_market_listings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_off_market_units_updated_at
BEFORE UPDATE ON public.off_market_units
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 9. Storage buckets
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('off-market-pricing', 'off-market-pricing', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('off-market-floorplans', 'off-market-floorplans', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('off-market-photos', 'off-market-photos', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('developer-logos', 'developer-logos', true) ON CONFLICT (id) DO NOTHING;

-- Storage policies for all 4 buckets
DO $$
DECLARE
  bucket_name text;
BEGIN
  FOREACH bucket_name IN ARRAY ARRAY['off-market-pricing','off-market-floorplans','off-market-photos','developer-logos']
  LOOP
    EXECUTE format(
      'CREATE POLICY "Public read %1$s" ON storage.objects FOR SELECT USING (bucket_id = %2$L)',
      bucket_name, bucket_name
    );
    EXECUTE format(
      'CREATE POLICY "Authenticated upload %1$s" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = %2$L)',
      bucket_name, bucket_name
    );
    EXECUTE format(
      'CREATE POLICY "Authenticated update %1$s" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = %2$L)',
      bucket_name, bucket_name
    );
    EXECUTE format(
      'CREATE POLICY "Authenticated delete %1$s" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = %2$L)',
      bucket_name, bucket_name
    );
  END LOOP;
END $$;

-- ============================================
-- 10. Indexes for performance
-- ============================================
CREATE INDEX idx_off_market_listings_status ON public.off_market_listings(status);
CREATE INDEX idx_off_market_listings_developer ON public.off_market_listings(developer_id);
CREATE INDEX idx_off_market_listings_slug ON public.off_market_listings(linked_project_slug);
CREATE INDEX idx_off_market_units_listing ON public.off_market_units(listing_id);
CREATE INDEX idx_off_market_units_status ON public.off_market_units(status);
CREATE INDEX idx_off_market_access_listing ON public.off_market_access(listing_id);
CREATE INDEX idx_off_market_access_email ON public.off_market_access(email);
CREATE INDEX idx_off_market_analytics_listing ON public.off_market_analytics(listing_id);
CREATE INDEX idx_off_market_analytics_event ON public.off_market_analytics(event_type);
