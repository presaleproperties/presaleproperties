-- Team member profile + approval status
CREATE TABLE IF NOT EXISTS public.team_member_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.team_member_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view own profile"
  ON public.team_member_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can insert own pending profile"
  ON public.team_member_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending');

CREATE POLICY "Admins can update team profiles"
  ON public.team_member_profiles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete team profiles"
  ON public.team_member_profiles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_team_member_profiles_updated_at
  BEFORE UPDATE ON public.team_member_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add scope column to campaign_templates: 'personal' | 'team' | 'library'
ALTER TABLE public.campaign_templates
  ADD COLUMN IF NOT EXISTS scope text NOT NULL DEFAULT 'personal';

-- Seeded library/system templates: those without an owner
UPDATE public.campaign_templates
SET scope = 'library'
WHERE user_id IS NULL AND scope = 'personal';

CREATE INDEX IF NOT EXISTS idx_campaign_templates_scope ON public.campaign_templates(scope);

-- Refresh RLS so team-scoped templates are visible to all team members + admins
DROP POLICY IF EXISTS "Agents can view own and shared templates" ON public.campaign_templates;

CREATE POLICY "Users can view own personal, all team, and library templates"
  ON public.campaign_templates FOR SELECT
  TO authenticated
  USING (
    scope = 'library'
    OR (scope = 'team' AND (
        public.has_role(auth.uid(), 'admin'::app_role)
        OR public.has_role(auth.uid(), 'team_member'::app_role)
        OR public.has_role(auth.uid(), 'agent'::app_role)
    ))
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Agents can insert own templates" ON public.campaign_templates;
CREATE POLICY "Users can insert own templates"
  ON public.campaign_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      scope = 'personal'
      OR (scope = 'team' AND (
          public.has_role(auth.uid(), 'admin'::app_role)
          OR public.has_role(auth.uid(), 'team_member'::app_role)
          OR public.has_role(auth.uid(), 'agent'::app_role)
      ))
      OR (scope = 'library' AND public.has_role(auth.uid(), 'admin'::app_role))
    )
  );

DROP POLICY IF EXISTS "Agents can update own templates" ON public.campaign_templates;
CREATE POLICY "Owners and admins can update templates"
  ON public.campaign_templates FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Agents can delete own templates" ON public.campaign_templates;
CREATE POLICY "Owners and admins can delete templates"
  ON public.campaign_templates FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));