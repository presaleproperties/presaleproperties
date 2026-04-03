
-- Track pitch deck visits
CREATE TABLE public.deck_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deck_id UUID,
  slug TEXT NOT NULL,
  project_name TEXT NOT NULL,
  visitor_id TEXT,
  lead_email TEXT,
  lead_name TEXT,
  visit_number INTEGER NOT NULL DEFAULT 1,
  device_type TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_deck_visits_visitor_slug ON public.deck_visits (visitor_id, slug);
CREATE INDEX idx_deck_visits_created ON public.deck_visits (created_at DESC);

-- Enable RLS
ALTER TABLE public.deck_visits ENABLE ROW LEVEL SECURITY;

-- Public can insert (anonymous visitors logging visits)
CREATE POLICY "Anyone can log a deck visit"
  ON public.deck_visits FOR INSERT
  WITH CHECK (true);

-- Only admins can read
CREATE POLICY "Admins can view deck visits"
  ON public.deck_visits FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger function to detect return visits and notify via WhatsApp
CREATE OR REPLACE FUNCTION public.notify_deck_return_visit()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  v_prev_count INTEGER;
  v_lead_label TEXT;
BEGIN
  -- Count previous visits by same visitor to same deck
  SELECT COUNT(*) INTO v_prev_count
  FROM public.deck_visits
  WHERE visitor_id = NEW.visitor_id
    AND slug = NEW.slug
    AND id != NEW.id;

  -- Set visit number
  NEW.visit_number := v_prev_count + 1;

  -- Only notify on return visits (2nd+)
  IF v_prev_count >= 1 THEN
    v_lead_label := COALESCE(NEW.lead_name, NEW.lead_email, 'Anonymous visitor');

    INSERT INTO public.notifications_queue (
      recipient_email, recipient_type, notification_type,
      subject, body, metadata
    ) VALUES (
      'info@presaleproperties.com',
      'admin',
      'deck_return_visit',
      '🔁 Return Visit: ' || v_lead_label || ' reopened ' || NEW.project_name,
      v_lead_label || ' just reopened the ' || NEW.project_name || ' pitch deck (visit #' || (v_prev_count + 1)::text || ').',
      jsonb_build_object(
        'slug', NEW.slug,
        'project_name', NEW.project_name,
        'visitor_id', NEW.visitor_id,
        'lead_email', NEW.lead_email,
        'lead_name', NEW.lead_name,
        'visit_number', v_prev_count + 1,
        'channel', 'whatsapp'
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_deck_return_visit
  BEFORE INSERT ON public.deck_visits
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_deck_return_visit();
