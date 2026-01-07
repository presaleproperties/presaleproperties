-- Create MLS listings table for RESO Web API data
CREATE TABLE public.mls_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- RESO Standard Fields - Listing Identification
  listing_key TEXT NOT NULL UNIQUE, -- MLS system unique identifier
  listing_id TEXT NOT NULL, -- MLS number (e.g., "R2912345")
  listing_contract_date DATE,
  listing_price NUMERIC NOT NULL,
  original_list_price NUMERIC,
  close_price NUMERIC,
  
  -- Property Type & Status
  property_type TEXT NOT NULL, -- Residential, Commercial, Land, etc.
  property_sub_type TEXT, -- Single Family, Condo, Townhouse, etc.
  mls_status TEXT NOT NULL DEFAULT 'Active', -- Active, Pending, Sold, Expired, etc.
  standard_status TEXT, -- RESO standard status mapping
  
  -- Location
  street_number TEXT,
  street_name TEXT,
  street_suffix TEXT,
  unit_number TEXT,
  city TEXT NOT NULL,
  state_or_province TEXT DEFAULT 'BC',
  postal_code TEXT,
  country TEXT DEFAULT 'CA',
  neighborhood TEXT,
  subdivision_name TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  unparsed_address TEXT, -- Full address string
  
  -- Property Details
  bedrooms_total INTEGER,
  bathrooms_total INTEGER,
  bathrooms_full INTEGER,
  bathrooms_half INTEGER,
  living_area NUMERIC, -- Square footage
  living_area_units TEXT DEFAULT 'sqft',
  lot_size_area NUMERIC,
  lot_size_units TEXT,
  year_built INTEGER,
  stories INTEGER,
  parking_total INTEGER,
  garage_spaces INTEGER,
  
  -- Features
  heating TEXT[],
  cooling TEXT[],
  appliances TEXT[],
  interior_features TEXT[],
  exterior_features TEXT[],
  community_features TEXT[],
  view TEXT[],
  waterfront_yn BOOLEAN DEFAULT FALSE,
  pool_yn BOOLEAN DEFAULT FALSE,
  
  -- Description & Remarks
  public_remarks TEXT,
  private_remarks TEXT, -- Agent-only notes
  directions TEXT,
  
  -- Media
  photos JSONB DEFAULT '[]'::jsonb, -- Array of {url, caption, order}
  virtual_tour_url TEXT,
  video_url TEXT,
  
  -- Listing Agent & Office
  list_agent_key TEXT,
  list_agent_mls_id TEXT,
  list_agent_name TEXT,
  list_agent_email TEXT,
  list_agent_phone TEXT,
  list_office_key TEXT,
  list_office_mls_id TEXT,
  list_office_name TEXT,
  list_office_phone TEXT,
  
  -- Buyer Agent (for sold listings)
  buyer_agent_key TEXT,
  buyer_agent_name TEXT,
  buyer_office_name TEXT,
  
  -- Dates
  list_date DATE,
  expiration_date DATE,
  close_date DATE,
  days_on_market INTEGER,
  cumulative_days_on_market INTEGER,
  
  -- Financial
  association_fee NUMERIC,
  association_fee_frequency TEXT,
  tax_annual_amount NUMERIC,
  tax_year INTEGER,
  
  -- Sync Metadata
  modification_timestamp TIMESTAMPTZ, -- Last modified in MLS
  photos_change_timestamp TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sync_status TEXT DEFAULT 'active', -- active, delisted, error
  raw_data JSONB, -- Store original RESO response for debugging
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mls_listings ENABLE ROW LEVEL SECURITY;

-- Public can view active MLS listings (IDX display)
CREATE POLICY "Anyone can view active MLS listings"
ON public.mls_listings
FOR SELECT
USING (mls_status IN ('Active', 'Pending'));

-- Admins can manage all MLS listings
CREATE POLICY "Admins can manage MLS listings"
ON public.mls_listings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for common queries
CREATE INDEX idx_mls_listings_city ON public.mls_listings(city);
CREATE INDEX idx_mls_listings_status ON public.mls_listings(mls_status);
CREATE INDEX idx_mls_listings_property_type ON public.mls_listings(property_type);
CREATE INDEX idx_mls_listings_price ON public.mls_listings(listing_price);
CREATE INDEX idx_mls_listings_bedrooms ON public.mls_listings(bedrooms_total);
CREATE INDEX idx_mls_listings_location ON public.mls_listings(latitude, longitude);
CREATE INDEX idx_mls_listings_listing_key ON public.mls_listings(listing_key);
CREATE INDEX idx_mls_listings_listing_id ON public.mls_listings(listing_id);
CREATE INDEX idx_mls_listings_last_synced ON public.mls_listings(last_synced_at);

-- Trigger for updated_at
CREATE TRIGGER update_mls_listings_updated_at
BEFORE UPDATE ON public.mls_listings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create sync log table to track API calls
CREATE TABLE public.mls_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_type TEXT NOT NULL, -- 'full', 'incremental', 'photos'
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  listings_fetched INTEGER DEFAULT 0,
  listings_created INTEGER DEFAULT 0,
  listings_updated INTEGER DEFAULT 0,
  listings_deleted INTEGER DEFAULT 0,
  error_message TEXT,
  status TEXT NOT NULL DEFAULT 'running' -- running, completed, failed
);

-- Enable RLS on sync logs
ALTER TABLE public.mls_sync_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view sync logs
CREATE POLICY "Admins can manage sync logs"
ON public.mls_sync_logs
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));