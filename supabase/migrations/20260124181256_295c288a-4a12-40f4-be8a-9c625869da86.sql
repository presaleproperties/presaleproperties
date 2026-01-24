-- Create mls_price_history table to track price changes during sync
CREATE TABLE public.mls_price_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_key TEXT NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  price NUMERIC NOT NULL,
  previous_price NUMERIC
);

-- Create index for efficient lookups by listing_key
CREATE INDEX idx_mls_price_history_listing_key ON public.mls_price_history(listing_key);
CREATE INDEX idx_mls_price_history_recorded_at ON public.mls_price_history(listing_key, recorded_at DESC);

-- Enable RLS
ALTER TABLE public.mls_price_history ENABLE ROW LEVEL SECURITY;

-- Anyone can view price history for active listings
CREATE POLICY "Anyone can view price history"
ON public.mls_price_history
FOR SELECT
USING (
  listing_key IN (
    SELECT listing_key FROM public.mls_listings 
    WHERE mls_status IN ('Active', 'Pending')
  )
);

-- Admins can manage price history
CREATE POLICY "Admins can manage price history"
ON public.mls_price_history
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to delete price history when listing is deleted
CREATE OR REPLACE FUNCTION public.delete_listing_price_history()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.mls_price_history WHERE listing_key = OLD.listing_key;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to cascade delete price history
CREATE TRIGGER trigger_delete_listing_price_history
BEFORE DELETE ON public.mls_listings
FOR EACH ROW
EXECUTE FUNCTION public.delete_listing_price_history();