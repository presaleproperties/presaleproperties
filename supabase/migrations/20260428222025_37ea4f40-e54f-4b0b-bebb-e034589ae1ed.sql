
-- Unified CRM messages/notes table for two-way sync with DealsFlow
CREATE TABLE IF NOT EXISTS public.crm_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Identity (at least one required)
  email TEXT,
  phone TEXT,
  visitor_id TEXT,
  lead_id UUID REFERENCES public.project_leads(id) ON DELETE SET NULL,
  crm_contact_id TEXT,

  -- Message metadata
  channel TEXT NOT NULL CHECK (channel IN ('note','sms','call','email','whatsapp','meeting','task_comment')),
  direction TEXT NOT NULL CHECK (direction IN ('inbound','outbound','internal')),
  body TEXT,
  subject TEXT,

  -- Authorship
  author_type TEXT NOT NULL DEFAULT 'system' CHECK (author_type IN ('agent','admin','system','contact','crm')),
  author_id UUID,
  author_name TEXT,
  author_email TEXT,

  -- Source/sync
  source TEXT NOT NULL DEFAULT 'website',  -- 'website' | 'dealsflow'
  external_id TEXT,                         -- DealsFlow message id (for dedupe)
  synced_to_crm_at TIMESTAMPTZ,
  sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending','synced','failed','skip')),

  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_messages_email ON public.crm_messages(lower(email));
CREATE INDEX IF NOT EXISTS idx_crm_messages_lead ON public.crm_messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_messages_occurred ON public.crm_messages(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_messages_external ON public.crm_messages(source, external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_messages_sync ON public.crm_messages(sync_status) WHERE sync_status IN ('pending','failed');

-- Dedupe inbound from DealsFlow on (source, external_id)
CREATE UNIQUE INDEX IF NOT EXISTS uq_crm_messages_external
  ON public.crm_messages(source, external_id)
  WHERE external_id IS NOT NULL;

ALTER TABLE public.crm_messages ENABLE ROW LEVEL SECURITY;

-- RLS: admins full access
CREATE POLICY "Admins manage crm_messages"
  ON public.crm_messages FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Agents can see messages for leads assigned to them (via crm_identity_map)
CREATE POLICY "Agents view their assigned messages"
  ON public.crm_messages FOR SELECT
  USING (
    public.has_role(auth.uid(), 'agent'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.crm_identity_map m
      WHERE lower(m.email) = lower(crm_messages.email)
        AND m.assigned_agent_id = auth.uid()::text
    )
  );

-- Agents can insert outbound messages/notes for their leads
CREATE POLICY "Agents create messages for their leads"
  ON public.crm_messages FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'agent'::app_role)
    AND author_id = auth.uid()
    AND direction IN ('outbound','internal')
  );

CREATE TRIGGER trg_crm_messages_updated_at
  BEFORE UPDATE ON public.crm_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-enqueue website-originated messages to DealsFlow outbox
CREATE OR REPLACE FUNCTION public.enqueue_message_to_crm()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only push messages that originated on the website (not echoes from CRM)
  IF NEW.source <> 'website' OR NEW.sync_status = 'skip' THEN
    RETURN NEW;
  END IF;

  PERFORM public.enqueue_crm_outbox(
    p_kind     := 'event',
    p_endpoint := 'push-activity-to-crm',
    p_payload  := jsonb_build_object(
      'event_type', 'message.' || NEW.channel,
      'email', NEW.email,
      'source', 'presale_properties_message',
      'payload', jsonb_build_object(
        'message_id', NEW.id,
        'channel', NEW.channel,
        'direction', NEW.direction,
        'body', NEW.body,
        'subject', NEW.subject,
        'author_name', NEW.author_name,
        'author_email', NEW.author_email,
        'author_type', NEW.author_type,
        'lead_id', NEW.lead_id,
        'crm_contact_id', NEW.crm_contact_id,
        'occurred_at', NEW.occurred_at,
        'metadata', NEW.metadata
      )
    ),
    p_email    := NEW.email,
    p_event_id := 'message:' || NEW.id::text
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'enqueue_message_to_crm failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enqueue_message_to_crm
  AFTER INSERT ON public.crm_messages
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_message_to_crm();
