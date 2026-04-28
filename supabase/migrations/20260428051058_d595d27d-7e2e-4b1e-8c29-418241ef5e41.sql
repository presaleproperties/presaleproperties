ALTER TABLE public.presale_projects
  ADD COLUMN IF NOT EXISTS incentives_jsonb jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS roi_summary text;