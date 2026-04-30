-- Add agent_slug to team_members (stable, immutable identifier)
ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS agent_slug TEXT;

-- Backfill slugs from full_name
UPDATE public.team_members
SET agent_slug = lower(regexp_replace(full_name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE agent_slug IS NULL;

-- Trim leading/trailing hyphens
UPDATE public.team_members
SET agent_slug = trim(both '-' from agent_slug)
WHERE agent_slug IS NOT NULL;

ALTER TABLE public.team_members
  ALTER COLUMN agent_slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS team_members_agent_slug_idx
  ON public.team_members(agent_slug);

-- Add new ownership columns to campaign_templates (in addition to existing scope/user_id)
ALTER TABLE public.campaign_templates
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS owner_scope TEXT,
  ADD COLUMN IF NOT EXISTS owner_agent_slug TEXT,
  ADD COLUMN IF NOT EXISTS created_by_agent_slug TEXT,
  ADD COLUMN IF NOT EXISTS sync_hash TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Backfill slugs for existing templates
UPDATE public.campaign_templates
SET slug = id::text
WHERE slug IS NULL;

-- Backfill owner_scope from existing scope column
UPDATE public.campaign_templates ct
SET owner_scope = CASE
    WHEN ct.scope = 'team' THEN 'team:presale'
    WHEN ct.scope = 'library' THEN 'team:presale'
    ELSE 'agent:' || COALESCE(tm.agent_slug, ct.user_id::text, 'unknown')
  END,
  owner_agent_slug = CASE
    WHEN ct.scope IN ('team', 'library') THEN NULL
    ELSE tm.agent_slug
  END,
  created_by_agent_slug = tm.agent_slug
FROM (SELECT user_id, agent_slug FROM public.team_members) tm
WHERE ct.user_id = tm.user_id;

-- Catch any orphans
UPDATE public.campaign_templates
SET owner_scope = COALESCE(owner_scope, 'team:presale')
WHERE owner_scope IS NULL;

ALTER TABLE public.campaign_templates
  ALTER COLUMN slug SET NOT NULL,
  ALTER COLUMN owner_scope SET NOT NULL,
  ADD CONSTRAINT campaign_templates_owner_scope_format
    CHECK (owner_scope ~ '^(agent:[a-z0-9-]+|team:[a-z0-9-]+)$');

CREATE UNIQUE INDEX IF NOT EXISTS campaign_templates_slug_idx
  ON public.campaign_templates(slug);
CREATE INDEX IF NOT EXISTS campaign_templates_owner_idx
  ON public.campaign_templates(owner_scope, owner_agent_slug);

-- Helper: get caller's agent_slug from team_members
CREATE OR REPLACE FUNCTION public.current_agent_slug()
RETURNS TEXT
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT agent_slug FROM public.team_members WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Tighten RLS using owner_scope (replaces older policies)
DROP POLICY IF EXISTS "Users can view own personal, all team, and library templates" ON public.campaign_templates;
DROP POLICY IF EXISTS "Owners and admins can update templates" ON public.campaign_templates;
DROP POLICY IF EXISTS "Owners and admins can delete templates" ON public.campaign_templates;
DROP POLICY IF EXISTS "Users can insert own templates" ON public.campaign_templates;

CREATE POLICY "View team templates or own agent templates"
  ON public.campaign_templates FOR SELECT
  TO authenticated
  USING (
    is_active = true AND (
      owner_scope LIKE 'team:%'
      OR owner_agent_slug = public.current_agent_slug()
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  );

CREATE POLICY "Insert templates as self or team admin"
  ON public.campaign_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND (
      (owner_scope LIKE 'agent:%' AND owner_agent_slug = public.current_agent_slug())
      OR (owner_scope LIKE 'team:%' AND has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "Update own agent templates or team as admin"
  ON public.campaign_templates FOR UPDATE
  TO authenticated
  USING (
    (owner_agent_slug = public.current_agent_slug() AND owner_scope LIKE 'agent:%')
    OR (owner_scope LIKE 'team:%' AND has_role(auth.uid(), 'admin'::app_role))
  )
  WITH CHECK (
    (owner_agent_slug = public.current_agent_slug() AND owner_scope LIKE 'agent:%')
    OR (owner_scope LIKE 'team:%' AND has_role(auth.uid(), 'admin'::app_role))
  );

CREATE POLICY "Delete own agent templates or team as admin"
  ON public.campaign_templates FOR DELETE
  TO authenticated
  USING (
    (owner_agent_slug = public.current_agent_slug() AND owner_scope LIKE 'agent:%')
    OR (owner_scope LIKE 'team:%' AND has_role(auth.uid(), 'admin'::app_role))
  );

-- Auto-set slug + owner fields + sync_hash on insert/update
CREATE OR REPLACE FUNCTION public.campaign_templates_autofill()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_slug TEXT;
  v_subject TEXT;
  v_body TEXT;
BEGIN
  v_caller_slug := public.current_agent_slug();

  IF NEW.slug IS NULL THEN
    NEW.slug := NEW.id::text;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.created_by_agent_slug IS NULL THEN
      NEW.created_by_agent_slug := v_caller_slug;
    END IF;
    -- Default to agent scope if not specified
    IF NEW.owner_scope IS NULL THEN
      NEW.owner_scope := 'agent:' || COALESCE(v_caller_slug, 'unknown');
      NEW.owner_agent_slug := v_caller_slug;
    END IF;
  END IF;

  -- Compute sync_hash from subject + body
  v_subject := COALESCE(NEW.form_data->'copy'->>'subjectLine', NEW.name, '');
  v_body := COALESCE(NEW.form_data->>'finalHtml', '');
  NEW.sync_hash := encode(extensions.digest(v_subject || '|' || v_body, 'sha256'), 'hex');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS campaign_templates_autofill_trg ON public.campaign_templates;
CREATE TRIGGER campaign_templates_autofill_trg
  BEFORE INSERT OR UPDATE ON public.campaign_templates
  FOR EACH ROW EXECUTE FUNCTION public.campaign_templates_autofill();