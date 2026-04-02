
-- Create off_market_inquiries table
CREATE TABLE public.off_market_inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.off_market_listings(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES public.off_market_units(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  buyer_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  buyer_phone TEXT,
  message TEXT,
  unit_name TEXT,
  project_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.off_market_inquiries ENABLE ROW LEVEL SECURITY;

-- Users can insert their own inquiries
CREATE POLICY "Users can create their own inquiries"
ON public.off_market_inquiries
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view their own inquiries
CREATE POLICY "Users can view their own inquiries"
ON public.off_market_inquiries
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all inquiries
CREATE POLICY "Admins can view all inquiries"
ON public.off_market_inquiries
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update all inquiries
CREATE POLICY "Admins can update all inquiries"
ON public.off_market_inquiries
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Validation trigger
CREATE OR REPLACE FUNCTION public.validate_off_market_inquiry()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status NOT IN ('pending', 'contacted', 'closed') THEN
    RAISE EXCEPTION 'Invalid inquiry status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_off_market_inquiry
BEFORE INSERT OR UPDATE ON public.off_market_inquiries
FOR EACH ROW EXECUTE FUNCTION public.validate_off_market_inquiry();

-- Auto-update updated_at
CREATE TRIGGER update_off_market_inquiries_updated_at
BEFORE UPDATE ON public.off_market_inquiries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Notification trigger for admin
CREATE OR REPLACE FUNCTION public.notify_admin_new_unit_inquiry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.notifications_queue (recipient_email, recipient_type, notification_type, subject, body, metadata)
  VALUES (
    'info@presaleproperties.com',
    'admin',
    'new_unit_inquiry',
    '🔔 New Unit Interest: ' || COALESCE(NEW.project_name, 'Unknown') || ' — ' || COALESCE(NEW.unit_name, 'Unknown Unit'),
    'VIP buyer ' || NEW.buyer_name || ' (' || NEW.buyer_email || ') is interested in ' || COALESCE(NEW.unit_name, 'a unit') || ' at ' || COALESCE(NEW.project_name, 'Unknown') || '. Message: ' || COALESCE(NEW.message, 'N/A'),
    jsonb_build_object(
      'inquiry_id', NEW.id,
      'listing_id', NEW.listing_id,
      'unit_id', NEW.unit_id,
      'buyer_name', NEW.buyer_name,
      'buyer_email', NEW.buyer_email,
      'buyer_phone', NEW.buyer_phone,
      'unit_name', NEW.unit_name,
      'project_name', NEW.project_name
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_new_unit_inquiry
AFTER INSERT ON public.off_market_inquiries
FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_unit_inquiry();

-- Index for performance
CREATE INDEX idx_off_market_inquiries_user ON public.off_market_inquiries(user_id);
CREATE INDEX idx_off_market_inquiries_listing ON public.off_market_inquiries(listing_id);

-- Enable realtime for inquiries
ALTER PUBLICATION supabase_realtime ADD TABLE public.off_market_inquiries;
