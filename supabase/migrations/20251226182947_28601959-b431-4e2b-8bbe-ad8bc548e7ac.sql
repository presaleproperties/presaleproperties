-- Create saved_listings table for user favorites
CREATE TABLE public.saved_listings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, listing_id)
);

-- Enable RLS
ALTER TABLE public.saved_listings ENABLE ROW LEVEL SECURITY;

-- Users can view their own saved listings
CREATE POLICY "Users can view own saved listings"
ON public.saved_listings
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own saved listings
CREATE POLICY "Users can insert own saved listings"
ON public.saved_listings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own saved listings
CREATE POLICY "Users can delete own saved listings"
ON public.saved_listings
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_saved_listings_user_id ON public.saved_listings(user_id);
CREATE INDEX idx_saved_listings_listing_id ON public.saved_listings(listing_id);