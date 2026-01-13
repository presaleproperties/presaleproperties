-- Create market_data table for admin-managed investment metrics
CREATE TABLE public.market_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL UNIQUE,
  avg_price_sqft INTEGER NOT NULL DEFAULT 800,
  rental_yield DECIMAL(3,1) NOT NULL DEFAULT 4.0,
  appreciation_5yr DECIMAL(4,1) NOT NULL DEFAULT 30.0,
  avg_rent_1br INTEGER NOT NULL DEFAULT 1900,
  avg_rent_2br INTEGER NOT NULL DEFAULT 2500,
  source_name TEXT NOT NULL DEFAULT 'REBGV MLS HPI',
  source_url TEXT,
  last_verified_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add comment for documentation
COMMENT ON TABLE public.market_data IS 'Admin-managed market metrics for investment analysis. Sources: REBGV, FVREB, CMHC.';

-- Enable RLS
ALTER TABLE public.market_data ENABLE ROW LEVEL SECURITY;

-- Public read access (data is non-sensitive market info)
CREATE POLICY "Market data is publicly readable"
ON public.market_data
FOR SELECT
USING (true);

-- Admin-only write access
CREATE POLICY "Admins can manage market data"
ON public.market_data
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add updated_at trigger
CREATE TRIGGER update_market_data_updated_at
BEFORE UPDATE ON public.market_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial data with sources
INSERT INTO public.market_data (city, avg_price_sqft, rental_yield, appreciation_5yr, avg_rent_1br, avg_rent_2br, source_name, source_url, notes) VALUES
('Vancouver', 1350, 3.2, 25.0, 2400, 3200, 'REBGV MLS HPI', 'https://www.rebgv.org/market-watch', 'Metro Vancouver benchmark'),
('Burnaby', 1050, 3.5, 28.0, 2200, 2900, 'REBGV MLS HPI', 'https://www.rebgv.org/market-watch', NULL),
('Surrey', 750, 4.2, 35.0, 1900, 2500, 'FVREB MLS HPI', 'https://www.fvreb.bc.ca/statistics', 'Strong growth market'),
('Langley', 720, 4.0, 32.0, 1850, 2400, 'FVREB MLS HPI', 'https://www.fvreb.bc.ca/statistics', NULL),
('Coquitlam', 950, 3.8, 30.0, 2100, 2800, 'REBGV MLS HPI', 'https://www.rebgv.org/market-watch', NULL),
('Richmond', 1100, 3.4, 26.0, 2300, 3000, 'REBGV MLS HPI', 'https://www.rebgv.org/market-watch', NULL),
('Delta', 680, 4.5, 30.0, 1750, 2300, 'FVREB MLS HPI', 'https://www.fvreb.bc.ca/statistics', NULL),
('Abbotsford', 580, 5.0, 35.0, 1600, 2100, 'FVREB MLS HPI', 'https://www.fvreb.bc.ca/statistics', 'Highest rental yield'),
('Port Moody', 1000, 3.6, 28.0, 2150, 2850, 'REBGV MLS HPI', 'https://www.rebgv.org/market-watch', NULL),
('New Westminster', 900, 3.9, 27.0, 2000, 2700, 'REBGV MLS HPI', 'https://www.rebgv.org/market-watch', NULL),
('Chilliwack', 520, 5.2, 38.0, 1500, 1950, 'FVREB MLS HPI', 'https://www.fvreb.bc.ca/statistics', NULL),
('White Rock', 1150, 3.3, 24.0, 2350, 3050, 'FVREB MLS HPI', 'https://www.fvreb.bc.ca/statistics', NULL);