ALTER TABLE public.pitch_decks
  ADD COLUMN IF NOT EXISTS units_remaining integer,
  ADD COLUMN IF NOT EXISTS next_price_increase text;