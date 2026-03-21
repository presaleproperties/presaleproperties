-- Add lead gate settings to pitch_decks
ALTER TABLE public.pitch_decks
  ADD COLUMN IF NOT EXISTS gate_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS gated_sections text[] NOT NULL DEFAULT ARRAY['floor-plans', 'deposit-timeline', 'projections']::text[];