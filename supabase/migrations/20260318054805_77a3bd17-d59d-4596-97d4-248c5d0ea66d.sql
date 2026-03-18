
ALTER TABLE public.pitch_decks
  ADD COLUMN IF NOT EXISTS assignment_fee TEXT,
  ADD COLUMN IF NOT EXISTS included_items TEXT[];
