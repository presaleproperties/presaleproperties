ALTER TABLE public.email_templates
  ADD COLUMN IF NOT EXISTS crm_id text,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'presale',
  ADD COLUMN IF NOT EXISTS sync_hash text,
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS body_html text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS merge_tags jsonb DEFAULT '[]'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS email_templates_crm_id_key
  ON public.email_templates (crm_id)
  WHERE crm_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS email_templates_source_idx
  ON public.email_templates (source);