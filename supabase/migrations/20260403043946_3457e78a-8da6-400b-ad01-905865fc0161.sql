ALTER TABLE public.presale_projects
ADD COLUMN IF NOT EXISTS show_in_hero boolean NOT NULL DEFAULT false;