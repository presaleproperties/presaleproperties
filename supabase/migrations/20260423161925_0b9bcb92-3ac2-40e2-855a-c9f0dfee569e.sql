-- ============================================================================
-- Lead Approval Workflow
-- Adds an admin approval gate between project lead form submission and
-- the lead-facing auto-response email. Lead data still flows to Zapier
-- and the internal team notification still fires immediately.
-- ============================================================================

-- 1. Approval columns on project_leads
ALTER TABLE public.project_leads
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS realtor_risk_score integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS realtor_risk_signals jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS auto_response_sent_at timestamptz;

-- Constrain approval_status values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'project_leads_approval_status_check'
  ) THEN
    ALTER TABLE public.project_leads
      ADD CONSTRAINT project_leads_approval_status_check
      CHECK (approval_status IN ('pending','approved','rejected','auto_skipped'));
  END IF;
END $$;

-- Index for the approvals queue
CREATE INDEX IF NOT EXISTS idx_project_leads_approval_pending
  ON public.project_leads (created_at DESC)
  WHERE approval_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_project_leads_approval_status
  ON public.project_leads (approval_status, created_at DESC);

-- 2. Realtor-domain reference table — known brokerage email domains
CREATE TABLE IF NOT EXISTS public.realtor_email_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL UNIQUE,
  brokerage_name text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.realtor_email_domains ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage realtor domains" ON public.realtor_email_domains;
CREATE POLICY "Admins manage realtor domains"
  ON public.realtor_email_domains
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Block anon realtor domains" ON public.realtor_email_domains;
CREATE POLICY "Block anon realtor domains"
  ON public.realtor_email_domains
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Seed common Canadian brokerage domains
INSERT INTO public.realtor_email_domains (domain, brokerage_name) VALUES
  ('remax.ca', 'RE/MAX'),
  ('remax.net', 'RE/MAX'),
  ('royallepage.ca', 'Royal LePage'),
  ('sutton.com', 'Sutton'),
  ('century21.ca', 'Century 21'),
  ('exitrealty.com', 'EXIT Realty'),
  ('kw.com', 'Keller Williams'),
  ('kellerwilliams.com', 'Keller Williams'),
  ('realtypoint.ca', 'Realty Point'),
  ('rew.ca', 'REW'),
  ('homelife.ca', 'HomeLife'),
  ('macdonaldrealty.com', 'Macdonald Realty'),
  ('oakwynrealty.com', 'Oakwyn Realty'),
  ('engelvoelkers.com', 'Engel & Völkers'),
  ('sothebysrealty.ca', 'Sotheby''s'),
  ('coldwellbanker.ca', 'Coldwell Banker'),
  ('exprealty.com', 'eXp Realty'),
  ('exprealty.ca', 'eXp Realty'),
  ('therealbrokerage.com', 'Real Broker'),
  ('onepercentrealty.com', '1% Realty'),
  ('stilhavn.com', 'Stilhavn'),
  ('rennie.com', 'Rennie & Associates'),
  ('dexterrealty.com', 'Dexter Realty'),
  ('virani.com', 'Virani Real Estate')
ON CONFLICT (domain) DO NOTHING;

-- 3. Risk-scoring function (callable from edge functions and UI)
CREATE OR REPLACE FUNCTION public.score_lead_realtor_risk(p_lead_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_lead RECORD;
  v_score integer := 0;
  v_signals jsonb := '[]'::jsonb;
  v_domain text;
  v_brokerage text;
  v_msg_lower text;
BEGIN
  SELECT * INTO v_lead FROM public.project_leads WHERE id = p_lead_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('score', 0, 'signals', '[]'::jsonb);
  END IF;

  -- Self-declared realtor (highest signal)
  IF v_lead.persona = 'realtor' OR v_lead.agent_status IN ('i_am_realtor','have_realtor') THEN
    v_score := v_score + 60;
    v_signals := v_signals || jsonb_build_object('type','self_declared','weight',60,'detail',COALESCE(v_lead.agent_status, v_lead.persona));
  END IF;

  -- Email domain matches a known brokerage
  v_domain := lower(split_part(COALESCE(v_lead.email,''), '@', 2));
  IF v_domain <> '' THEN
    SELECT brokerage_name INTO v_brokerage
    FROM public.realtor_email_domains
    WHERE domain = v_domain
    LIMIT 1;
    IF v_brokerage IS NOT NULL THEN
      v_score := v_score + 50;
      v_signals := v_signals || jsonb_build_object('type','brokerage_email','weight',50,'detail',v_brokerage);
    END IF;
  END IF;

  -- Message keywords suggesting an agent
  v_msg_lower := lower(COALESCE(v_lead.message, ''));
  IF v_msg_lower ~ '\m(realtor|agent|broker|client|my buyer|cooperat|co[- ]?broke|commission)\M' THEN
    v_score := v_score + 25;
    v_signals := v_signals || jsonb_build_object('type','message_keywords','weight',25,'detail','agent-related keyword in message');
  END IF;

  -- No phone / very short phone
  IF v_lead.phone IS NULL OR length(regexp_replace(v_lead.phone, '\D', '', 'g')) < 10 THEN
    v_score := v_score + 10;
    v_signals := v_signals || jsonb_build_object('type','missing_phone','weight',10,'detail','no valid phone');
  END IF;

  -- Same email already submitted multiple project leads recently
  IF EXISTS (
    SELECT 1 FROM public.project_leads pl
    WHERE pl.email = v_lead.email
      AND pl.id <> v_lead.id
      AND pl.created_at > now() - interval '30 days'
    HAVING count(*) >= 3
  ) THEN
    v_score := v_score + 15;
    v_signals := v_signals || jsonb_build_object('type','frequent_submitter','weight',15,'detail','3+ submissions in 30 days');
  END IF;

  -- Cap at 100
  v_score := LEAST(v_score, 100);

  RETURN jsonb_build_object('score', v_score, 'signals', v_signals);
END;
$$;

-- 4. Auto-score on insert/update of project_leads
CREATE OR REPLACE FUNCTION public.set_project_lead_risk_score()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Only score project-form leads that are still pending
  IF NEW.approval_status = 'pending' THEN
    v_result := public.score_lead_realtor_risk(NEW.id);
    NEW.realtor_risk_score := COALESCE((v_result->>'score')::int, 0);
    NEW.realtor_risk_signals := COALESCE(v_result->'signals', '[]'::jsonb);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_project_lead_risk_score ON public.project_leads;
CREATE TRIGGER trg_project_lead_risk_score
  BEFORE INSERT OR UPDATE OF email, phone, message, persona, agent_status
  ON public.project_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.set_project_lead_risk_score();

-- 5. Notify admin on new pending lead (in-app badge + queued email)
CREATE OR REPLACE FUNCTION public.notify_admin_pending_lead_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_risk_label text;
BEGIN
  IF NEW.approval_status <> 'pending' THEN
    RETURN NEW;
  END IF;

  v_risk_label := CASE
    WHEN NEW.realtor_risk_score >= 60 THEN '🚩 HIGH realtor risk'
    WHEN NEW.realtor_risk_score >= 30 THEN '⚠️ Medium realtor risk'
    ELSE '✅ Low risk'
  END;

  INSERT INTO public.notifications_queue (
    recipient_email, recipient_type, notification_type,
    subject, body, metadata
  ) VALUES (
    'info@presaleproperties.com',
    'admin',
    'lead_approval_pending',
    '🕒 Lead awaiting approval — ' || COALESCE(NEW.name, 'Unknown') || ' (' || v_risk_label || ')',
    'New project lead from ' || COALESCE(NEW.name, 'Unknown') || ' (' || COALESCE(NEW.email, 'no email') || ') is awaiting your review. Risk score: ' || NEW.realtor_risk_score::text || '/100. Approve or reject in the admin dashboard.',
    jsonb_build_object(
      'lead_id', NEW.id,
      'name', NEW.name,
      'email', NEW.email,
      'phone', NEW.phone,
      'risk_score', NEW.realtor_risk_score,
      'risk_signals', NEW.realtor_risk_signals,
      'lead_source', NEW.lead_source,
      'project_id', NEW.project_id,
      'review_url', 'https://presaleproperties.com/admin/lead-approvals'
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admin_pending_lead_approval ON public.project_leads;
CREATE TRIGGER trg_notify_admin_pending_lead_approval
  AFTER INSERT ON public.project_leads
  FOR EACH ROW
  WHEN (NEW.approval_status = 'pending')
  EXECUTE FUNCTION public.notify_admin_pending_lead_approval();