-- Create table to track sent expiration notifications
CREATE TABLE public.expiration_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  notification_type text NOT NULL, -- '30_day', '7_day', '1_day'
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(listing_id, notification_type)
);

-- Enable RLS
ALTER TABLE public.expiration_notifications ENABLE ROW LEVEL SECURITY;

-- Only allow system (service role) to manage notifications
CREATE POLICY "Service role can manage notifications"
ON public.expiration_notifications
FOR ALL
USING (false)
WITH CHECK (false);

-- Create index for efficient lookups
CREATE INDEX idx_expiration_notifications_listing ON public.expiration_notifications(listing_id);