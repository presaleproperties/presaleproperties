-- Create geocoding_logs table to track geocoding progress and API usage
CREATE TABLE public.geocoding_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'running',
  listings_processed INTEGER DEFAULT 0,
  listings_updated INTEGER DEFAULT 0,
  listings_errors INTEGER DEFAULT 0,
  remaining_count INTEGER DEFAULT 0,
  api_calls_made INTEGER DEFAULT 0,
  batch_size INTEGER DEFAULT 50,
  city_filter TEXT,
  error_message TEXT,
  trigger_source TEXT DEFAULT 'manual' -- 'manual', 'cron', 'api'
);

-- Create index for faster queries
CREATE INDEX idx_geocoding_logs_started_at ON public.geocoding_logs(started_at DESC);

-- Enable RLS
ALTER TABLE public.geocoding_logs ENABLE ROW LEVEL SECURITY;

-- Allow admins to read geocoding logs
CREATE POLICY "Admins can read geocoding logs" ON public.geocoding_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Allow service role to insert/update (for edge functions)
CREATE POLICY "Service role can manage geocoding logs" ON public.geocoding_logs
  FOR ALL USING (true) WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE public.geocoding_logs IS 'Tracks geocoding operations for MLS listings, including API usage and progress';