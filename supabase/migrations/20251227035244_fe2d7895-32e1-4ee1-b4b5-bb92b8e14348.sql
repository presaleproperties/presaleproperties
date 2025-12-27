-- Create visibility_mode enum
CREATE TYPE public.visibility_mode AS ENUM ('public', 'restricted');

-- Add visibility_mode column to listings table with default 'public'
ALTER TABLE public.listings
ADD COLUMN visibility_mode public.visibility_mode NOT NULL DEFAULT 'public'::visibility_mode;