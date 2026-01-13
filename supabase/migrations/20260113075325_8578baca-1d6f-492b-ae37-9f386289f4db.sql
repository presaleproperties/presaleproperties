-- Add unique constraint on city for market_data to enable upserts
ALTER TABLE public.market_data ADD CONSTRAINT market_data_city_unique UNIQUE (city);