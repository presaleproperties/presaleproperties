-- 1. Slug redirect lookup table (preserves any links already in the wild)
CREATE TABLE IF NOT EXISTS public.project_slug_redirects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  old_slug text NOT NULL UNIQUE,
  new_slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS project_slug_redirects_old_slug_idx
  ON public.project_slug_redirects (old_slug);

ALTER TABLE public.project_slug_redirects ENABLE ROW LEVEL SECURITY;

-- Public read so the SPA can resolve redirects without auth
DROP POLICY IF EXISTS "Public can read slug redirects" ON public.project_slug_redirects;
CREATE POLICY "Public can read slug redirects"
  ON public.project_slug_redirects
  FOR SELECT
  USING (true);

-- 2. Record the old → new mapping BEFORE updating the slugs
INSERT INTO public.project_slug_redirects (old_slug, new_slug) VALUES
  ('east-ridge-at-cooper-meadows-(townhomes)', 'east-ridge-at-cooper-meadows-townhomes'),
  ('kʷasən-village',                           'kwasen-village'),
  ('south-hill-cooper-meadows-(duplex)',       'south-hill-cooper-meadows-duplex'),
  ('matteō',                                   'matteo'),
  ('söenhaus',                                 'soenhaus')
ON CONFLICT (old_slug) DO NOTHING;

-- 3. Update the project slugs to URL-safe versions
UPDATE public.presale_projects SET slug = 'east-ridge-at-cooper-meadows-townhomes'
  WHERE slug = 'east-ridge-at-cooper-meadows-(townhomes)';
UPDATE public.presale_projects SET slug = 'kwasen-village'
  WHERE slug = 'kʷasən-village';
UPDATE public.presale_projects SET slug = 'south-hill-cooper-meadows-duplex'
  WHERE slug = 'south-hill-cooper-meadows-(duplex)';
UPDATE public.presale_projects SET slug = 'matteo'
  WHERE slug = 'matteō';
UPDATE public.presale_projects SET slug = 'soenhaus'
  WHERE slug = 'söenhaus';