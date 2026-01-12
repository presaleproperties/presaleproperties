-- Add open house columns to mls_listings table
ALTER TABLE public.mls_listings 
ADD COLUMN IF NOT EXISTS open_house_date DATE,
ADD COLUMN IF NOT EXISTS open_house_start_time TIME,
ADD COLUMN IF NOT EXISTS open_house_end_time TIME,
ADD COLUMN IF NOT EXISTS open_house_remarks TEXT;

-- Add index for querying listings with upcoming open houses
CREATE INDEX IF NOT EXISTS idx_mls_listings_open_house ON public.mls_listings (open_house_date) 
WHERE open_house_date IS NOT NULL;