ALTER TABLE public.pitch_decks
  ADD COLUMN IF NOT EXISTS linked_project_id uuid,
  ADD COLUMN IF NOT EXISTS lat numeric,
  ADD COLUMN IF NOT EXISTS lng numeric;