
-- Fix mutable search_path on functions that may be missing it
-- Re-create update_updated_at_column with locked search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Re-create cleanup_rate_limit_log with locked search_path
CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_log()
  RETURNS void
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path = ''
AS $$
  DELETE FROM public.rate_limit_log
  WHERE created_at < now() - interval '2 hours';
$$;
