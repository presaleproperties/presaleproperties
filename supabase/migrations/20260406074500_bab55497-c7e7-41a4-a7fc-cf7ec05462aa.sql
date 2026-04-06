
ALTER TABLE public.developers
  ADD COLUMN IF NOT EXISTS founded_year integer,
  ADD COLUMN IF NOT EXISTS focus text[] DEFAULT '{}';
