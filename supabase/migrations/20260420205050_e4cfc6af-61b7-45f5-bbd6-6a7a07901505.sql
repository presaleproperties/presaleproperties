
-- ============ AD SPEND ============
CREATE TABLE public.ad_spend (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spend_date DATE NOT NULL,
  utm_source TEXT NOT NULL,
  utm_campaign TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CAD',
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ad_spend_date ON public.ad_spend(spend_date DESC);
CREATE INDEX idx_ad_spend_source ON public.ad_spend(utm_source, utm_campaign);
ALTER TABLE public.ad_spend ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage ad_spend" ON public.ad_spend FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Block anon ad_spend" ON public.ad_spend FOR ALL TO anon USING (false) WITH CHECK (false);

-- ============ PIXEL HEALTH LOG ============
CREATE TABLE public.pixel_health_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_url TEXT NOT NULL,
  page_type TEXT,
  pixel_loaded BOOLEAN NOT NULL DEFAULT false,
  fbp_set BOOLEAN NOT NULL DEFAULT false,
  ga_loaded BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_pixel_health_url ON public.pixel_health_log(page_url, checked_at DESC);
ALTER TABLE public.pixel_health_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read pixel_health" ON public.pixel_health_log FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Anyone can insert pixel_health" ON public.pixel_health_log FOR INSERT TO public WITH CHECK (true);

-- ============ ALERT CONFIG ============
CREATE TABLE public.alert_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  hot_lead_enabled BOOLEAN NOT NULL DEFAULT true,
  hot_lead_threshold INTEGER NOT NULL DEFAULT 70,
  sync_failure_enabled BOOLEAN NOT NULL DEFAULT true,
  daily_digest_enabled BOOLEAN NOT NULL DEFAULT true,
  digest_hour_utc INTEGER NOT NULL DEFAULT 13,
  meta_test_mode BOOLEAN NOT NULL DEFAULT false,
  meta_test_event_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.alert_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage alert_config" ON public.alert_config FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

-- ============ ALERT LOG ============
CREATE TABLE public.alert_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT,
  payload JSONB,
  status TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT,
  related_id UUID,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_alert_log_type_date ON public.alert_log(alert_type, sent_at DESC);
ALTER TABLE public.alert_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read alert_log" ON public.alert_log FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role));

-- ============ ATTRIBUTION TOUCHES ============
CREATE TABLE public.attribution_touches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT NOT NULL,
  touch_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  referrer TEXT,
  landing_url TEXT,
  page_url TEXT,
  is_first_touch BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX idx_attr_visitor ON public.attribution_touches(visitor_id, touch_at);
ALTER TABLE public.attribution_touches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert touches" ON public.attribution_touches FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Admins read touches" ON public.attribution_touches FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role));

-- ============ A/B TEST VARIANTS ============
CREATE TABLE public.ab_test_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_key TEXT NOT NULL,
  variant_key TEXT NOT NULL,
  variant_name TEXT NOT NULL,
  weight INTEGER NOT NULL DEFAULT 50,
  config JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(test_key, variant_key)
);
ALTER TABLE public.ab_test_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone read active variants" ON public.ab_test_variants FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Admins manage variants" ON public.ab_test_variants FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE TABLE public.ab_test_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT NOT NULL,
  test_key TEXT NOT NULL,
  variant_key TEXT NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  converted BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(visitor_id, test_key)
);
CREATE INDEX idx_ab_assign_test ON public.ab_test_assignments(test_key, variant_key);
ALTER TABLE public.ab_test_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone insert assignment" ON public.ab_test_assignments FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone update own assignment" ON public.ab_test_assignments FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Admins read assignments" ON public.ab_test_assignments FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role));

-- ============ PROJECT_LEADS COLUMNS ============
ALTER TABLE public.project_leads
  ADD COLUMN IF NOT EXISTS first_touch_utm_source TEXT,
  ADD COLUMN IF NOT EXISTS first_touch_utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS first_touch_utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS first_touch_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ab_variant TEXT,
  ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS meta_test_event_code TEXT;

-- ============ LEAD SCORING V2 ============
CREATE OR REPLACE FUNCTION public.calculate_lead_score_v2(p_lead_id UUID)
RETURNS INTEGER LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_score INTEGER := 0;
  v_lead RECORD;
  v_activity_count INTEGER := 0;
BEGIN
  SELECT * INTO v_lead FROM project_leads WHERE id = p_lead_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  -- Base: contact info quality
  IF v_lead.phone IS NOT NULL AND length(v_lead.phone) >= 10 THEN v_score := v_score + 15; END IF;
  IF v_lead.email IS NOT NULL THEN v_score := v_score + 10; END IF;

  -- Source quality
  IF v_lead.utm_source IN ('meta','facebook','instagram','google') THEN v_score := v_score + 10; END IF;
  IF v_lead.lead_type = 'project_inquiry_lp' THEN v_score := v_score + 15; END IF;

  -- Behavior: visitor activity
  IF v_lead.visitor_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_activity_count FROM client_activity
      WHERE visitor_id = v_lead.visitor_id AND created_at > now() - interval '30 days';
    IF v_activity_count >= 3 THEN v_score := v_score + 20;
    ELSIF v_activity_count >= 1 THEN v_score := v_score + 10; END IF;
  END IF;

  -- Tracking quality (better tracked = more reliable lead)
  IF v_lead.fbp IS NOT NULL THEN v_score := v_score + 5; END IF;
  IF v_lead.event_id IS NOT NULL THEN v_score := v_score + 5; END IF;

  RETURN LEAST(v_score, 100);
END;
$$;

-- ============ SYNC LOG RETENTION ============
CREATE OR REPLACE FUNCTION public.cleanup_old_sync_logs()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.lead_sync_log WHERE created_at < now() - interval '90 days';
  DELETE FROM public.alert_log WHERE sent_at < now() - interval '180 days';
  DELETE FROM public.pixel_health_log WHERE checked_at < now() - interval '30 days';
END;
$$;

-- Seed default alert config
INSERT INTO public.alert_config (recipient_email)
SELECT 'info@presaleproperties.com'
WHERE NOT EXISTS (SELECT 1 FROM public.alert_config);

-- Seed default A/B variants
INSERT INTO public.ab_test_variants (test_key, variant_key, variant_name, weight, config) VALUES
  ('lp_hero', 'control', 'Original headline', 50, '{"headline_style":"default"}'::jsonb),
  ('lp_hero', 'urgency', 'Urgency headline', 50, '{"headline_style":"urgency"}'::jsonb)
ON CONFLICT (test_key, variant_key) DO NOTHING;
