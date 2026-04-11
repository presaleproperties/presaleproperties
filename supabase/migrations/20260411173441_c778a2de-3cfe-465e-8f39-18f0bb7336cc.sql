ALTER TABLE public.listings
ADD COLUMN listing_agent_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;