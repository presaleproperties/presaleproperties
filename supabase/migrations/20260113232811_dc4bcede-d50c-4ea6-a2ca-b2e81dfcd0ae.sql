-- Create enhanced market statistics table for monthly snapshots
CREATE TABLE public.city_market_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  city TEXT NOT NULL,
  report_month INTEGER NOT NULL CHECK (report_month >= 1 AND report_month <= 12),
  report_year INTEGER NOT NULL CHECK (report_year >= 2020 AND report_year <= 2050),
  property_type TEXT NOT NULL CHECK (property_type IN ('condo', 'townhome', 'detached')),
  
  -- Price metrics
  benchmark_price INTEGER,
  avg_price_sqft INTEGER,
  median_sale_price INTEGER,
  
  -- Market activity
  total_inventory INTEGER,
  total_sales INTEGER,
  sales_ratio DECIMAL(5,2),
  days_on_market INTEGER,
  sale_to_list_ratio DECIMAL(5,2),
  
  -- Price changes
  mom_price_change DECIMAL(5,2),
  yoy_price_change DECIMAL(5,2),
  
  -- Hot price bands (for marketing insights)
  hottest_price_band TEXT,
  hottest_price_band_ratio DECIMAL(5,2),
  
  -- Market type indicator
  market_type TEXT CHECK (market_type IN ('buyers', 'balanced', 'sellers')),
  
  -- Rental metrics (for investment analysis)
  avg_rent_1br INTEGER,
  avg_rent_2br INTEGER,
  rental_yield DECIMAL(5,2),
  
  -- Source tracking
  source_board TEXT DEFAULT 'FVREB',
  report_summary TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique constraint per city/month/year/type combo
  CONSTRAINT unique_city_month_type UNIQUE (city, report_month, report_year, property_type)
);

-- Enable RLS
ALTER TABLE public.city_market_stats ENABLE ROW LEVEL SECURITY;

-- Public read access for site-wide display
CREATE POLICY "Anyone can view market stats"
  ON public.city_market_stats
  FOR SELECT
  USING (true);

-- Admin-only write access
CREATE POLICY "Admins can manage market stats"
  ON public.city_market_stats
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create index for common queries
CREATE INDEX idx_city_market_stats_lookup ON public.city_market_stats (city, property_type, report_year DESC, report_month DESC);
CREATE INDEX idx_city_market_stats_latest ON public.city_market_stats (report_year DESC, report_month DESC);

-- Update timestamp trigger
CREATE TRIGGER update_city_market_stats_updated_at
  BEFORE UPDATE ON public.city_market_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();