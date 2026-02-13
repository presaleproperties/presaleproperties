
-- Add ip_address column to client_activity
ALTER TABLE public.client_activity ADD COLUMN ip_address text;
CREATE INDEX idx_client_activity_ip ON public.client_activity(ip_address);

-- Add last_ip column to clients
ALTER TABLE public.clients ADD COLUMN last_ip text;
