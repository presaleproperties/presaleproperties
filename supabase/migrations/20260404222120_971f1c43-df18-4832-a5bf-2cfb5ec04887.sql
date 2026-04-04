ALTER TABLE public.email_logs ADD COLUMN recipient_name text;

-- Ensure admins can delete email logs (existing ALL policy already covers this, but let's be explicit)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'email_logs' AND policyname = 'Admins can delete email logs'
  ) THEN
    CREATE POLICY "Admins can delete email logs"
    ON public.email_logs
    FOR DELETE
    TO authenticated
    USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;