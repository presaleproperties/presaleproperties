ALTER TABLE public.pitch_decks
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS highlights text[],
  ADD COLUMN IF NOT EXISTS amenities text[];