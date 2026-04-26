-- ============================================================================
-- CRM BRIDGE INFRASTRUCTURE — outbox, identity map, agent assignment cache
-- ============================================================================

-- 1. OUTBOX — every lead/event is written here first (transactional), then
--    drained by a worker. Guarantees zero-loss delivery to the CRM.
CREATE TABLE IF NOT EXISTS public.crm_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL CHECK (kind IN ('lead','event','identity','conversion')),
  endpoint TEXT NOT NULL,                -- which CRM bridge to call
  payload JSONB NOT NULL,
  email TEXT,                            -- for dedupe / debugging
  presale_user_id TEXT,
  event_id TEXT,                         -- dedupe key (Meta CAPI event_id)
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','synced','failed','dead')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_outbox_pending
  ON public.crm_outbox (next_attempt_at)
  WHERE status IN ('pending','failed');

CREATE INDEX IF NOT EXISTS idx_crm_outbox_email ON public.crm_outbox (email);
CREATE INDEX IF NOT EXISTS idx_crm_outbox_created ON public.crm_outbox (created_at DESC);

ALTER TABLE public.crm_outbox ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can enqueue — that's the whole point of an outbox.
CREATE POLICY "Anyone can enqueue outbox messages"
  ON public.crm_outbox FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Only admins read/manage the outbox UI.
CREATE POLICY "Admins can view outbox"
  ON public.crm_outbox FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update outbox"
  ON public.crm_outbox FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_crm_outbox_updated_at
  BEFORE UPDATE ON public.crm_outbox
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. IDENTITY MAP — stitches presale_user_id ↔ email ↔ phone ↔ CRM contact_id
--    Populated by both inbound webhooks AND outbound form submissions.
CREATE TABLE IF NOT EXISTS public.crm_identity_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presale_user_id TEXT,
  email TEXT,
  phone TEXT,
  crm_contact_id TEXT,                   -- DealzFlow CRM ID
  auth_user_id UUID,                     -- Supabase auth.users id (when known)
  -- CRM-side state mirrored locally for instant reads
  lifecycle_stage TEXT,                  -- lead, opportunity, customer, etc.
  assigned_agent_id TEXT,
  assigned_agent_name TEXT,
  assigned_agent_email TEXT,
  assigned_agent_phone TEXT,
  assigned_agent_photo_url TEXT,
  assigned_agent_calendly_url TEXT,
  tags TEXT[] DEFAULT '{}',
  hot_lead BOOLEAN DEFAULT false,
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_identity_map_email
  ON public.crm_identity_map (email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_identity_map_presale
  ON public.crm_identity_map (presale_user_id) WHERE presale_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_identity_map_phone
  ON public.crm_identity_map (phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_identity_map_contact
  ON public.crm_identity_map (crm_contact_id) WHERE crm_contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_identity_map_auth
  ON public.crm_identity_map (auth_user_id) WHERE auth_user_id IS NOT NULL;

ALTER TABLE public.crm_identity_map ENABLE ROW LEVEL SECURITY;

-- The identity map is read by the public site (so it can recognize known
-- visitors), but only via a SECURITY DEFINER function that scopes to the
-- caller's own email/presale_user_id. No direct reads.
REVOKE ALL ON public.crm_identity_map FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.crm_identity_map TO service_role;

CREATE POLICY "Admins can view identity map"
  ON public.crm_identity_map FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_crm_identity_map_updated_at
  BEFORE UPDATE ON public.crm_identity_map
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. RESOLVE FUNCTION — public-callable via edge function with service role.
--    Returns minimal "what does the CRM know about this person" payload.
CREATE OR REPLACE FUNCTION public.resolve_crm_identity(
  p_email TEXT DEFAULT NULL,
  p_presale_user_id TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row crm_identity_map%ROWTYPE;
BEGIN
  IF p_email IS NULL AND p_presale_user_id IS NULL AND p_phone IS NULL THEN
    RETURN '{"known": false}'::jsonb;
  END IF;

  SELECT * INTO v_row
  FROM crm_identity_map
  WHERE (p_email IS NOT NULL AND email = lower(trim(p_email)))
     OR (p_presale_user_id IS NOT NULL AND presale_user_id = p_presale_user_id)
     OR (p_phone IS NOT NULL AND phone = p_phone)
  ORDER BY
    -- Prefer rows with the most data
    (CASE WHEN crm_contact_id IS NOT NULL THEN 0 ELSE 1 END),
    updated_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN '{"known": false}'::jsonb;
  END IF;

  RETURN jsonb_build_object(
    'known', true,
    'crm_contact_id', v_row.crm_contact_id,
    'email', v_row.email,
    'lifecycle_stage', v_row.lifecycle_stage,
    'tags', v_row.tags,
    'hot_lead', v_row.hot_lead,
    'last_activity_at', v_row.last_activity_at,
    'assigned_agent', CASE
      WHEN v_row.assigned_agent_id IS NULL THEN NULL
      ELSE jsonb_build_object(
        'id', v_row.assigned_agent_id,
        'name', v_row.assigned_agent_name,
        'email', v_row.assigned_agent_email,
        'phone', v_row.assigned_agent_phone,
        'photo_url', v_row.assigned_agent_photo_url,
        'calendly_url', v_row.assigned_agent_calendly_url
      )
    END
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_crm_identity(TEXT, TEXT, TEXT)
  TO anon, authenticated, service_role;

-- 4. UPSERT helper used by the inbound webhook handler.
CREATE OR REPLACE FUNCTION public.upsert_crm_identity(p_data jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT := lower(trim(p_data->>'email'));
  v_id UUID;
BEGIN
  IF v_email = '' OR v_email IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO crm_identity_map AS m (
    email, presale_user_id, phone, crm_contact_id,
    lifecycle_stage, assigned_agent_id, assigned_agent_name,
    assigned_agent_email, assigned_agent_phone,
    assigned_agent_photo_url, assigned_agent_calendly_url,
    tags, hot_lead, last_activity_at
  ) VALUES (
    v_email,
    NULLIF(p_data->>'presale_user_id',''),
    NULLIF(p_data->>'phone',''),
    NULLIF(p_data->>'crm_contact_id',''),
    NULLIF(p_data->>'lifecycle_stage',''),
    NULLIF(p_data->'assigned_agent'->>'id',''),
    NULLIF(p_data->'assigned_agent'->>'name',''),
    NULLIF(p_data->'assigned_agent'->>'email',''),
    NULLIF(p_data->'assigned_agent'->>'phone',''),
    NULLIF(p_data->'assigned_agent'->>'photo_url',''),
    NULLIF(p_data->'assigned_agent'->>'calendly_url',''),
    COALESCE(
      ARRAY(SELECT jsonb_array_elements_text(p_data->'tags')),
      '{}'::TEXT[]
    ),
    COALESCE((p_data->>'hot_lead')::boolean, false),
    COALESCE((p_data->>'last_activity_at')::timestamptz, now())
  )
  ON CONFLICT (email) WHERE email IS NOT NULL DO UPDATE SET
    presale_user_id = COALESCE(EXCLUDED.presale_user_id, m.presale_user_id),
    phone = COALESCE(EXCLUDED.phone, m.phone),
    crm_contact_id = COALESCE(EXCLUDED.crm_contact_id, m.crm_contact_id),
    lifecycle_stage = COALESCE(EXCLUDED.lifecycle_stage, m.lifecycle_stage),
    assigned_agent_id = COALESCE(EXCLUDED.assigned_agent_id, m.assigned_agent_id),
    assigned_agent_name = COALESCE(EXCLUDED.assigned_agent_name, m.assigned_agent_name),
    assigned_agent_email = COALESCE(EXCLUDED.assigned_agent_email, m.assigned_agent_email),
    assigned_agent_phone = COALESCE(EXCLUDED.assigned_agent_phone, m.assigned_agent_phone),
    assigned_agent_photo_url = COALESCE(EXCLUDED.assigned_agent_photo_url, m.assigned_agent_photo_url),
    assigned_agent_calendly_url = COALESCE(EXCLUDED.assigned_agent_calendly_url, m.assigned_agent_calendly_url),
    tags = CASE WHEN array_length(EXCLUDED.tags,1) IS NULL THEN m.tags ELSE EXCLUDED.tags END,
    hot_lead = COALESCE((p_data->>'hot_lead')::boolean, m.hot_lead),
    last_activity_at = GREATEST(EXCLUDED.last_activity_at, m.last_activity_at),
    updated_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_crm_identity(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_crm_identity(jsonb) TO service_role;

-- 5. ENQUEUE helper — used by site code to drop a message in the outbox.
CREATE OR REPLACE FUNCTION public.enqueue_crm_outbox(
  p_kind TEXT,
  p_endpoint TEXT,
  p_payload jsonb,
  p_email TEXT DEFAULT NULL,
  p_presale_user_id TEXT DEFAULT NULL,
  p_event_id TEXT DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Dedupe by event_id when provided (Meta CAPI / form submission)
  IF p_event_id IS NOT NULL THEN
    SELECT id INTO v_id FROM crm_outbox
      WHERE event_id = p_event_id AND endpoint = p_endpoint LIMIT 1;
    IF FOUND THEN RETURN v_id; END IF;
  END IF;

  INSERT INTO crm_outbox (kind, endpoint, payload, email, presale_user_id, event_id)
  VALUES (p_kind, p_endpoint, p_payload,
          NULLIF(lower(trim(p_email)), ''),
          NULLIF(p_presale_user_id, ''),
          NULLIF(p_event_id, ''))
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.enqueue_crm_outbox(TEXT, TEXT, jsonb, TEXT, TEXT, TEXT)
  TO anon, authenticated, service_role;