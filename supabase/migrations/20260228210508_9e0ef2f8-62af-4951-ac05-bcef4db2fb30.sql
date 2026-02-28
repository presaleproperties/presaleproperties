
-- =============================================
-- EMAIL_VERIFICATION_CODES: No public read access
-- Anonymous insert is intentional (to request a code),
-- but nobody should be able to SELECT codes — only the
-- edge function (service role) reads them server-side.
-- =============================================

-- Drop any existing SELECT policy that might allow public reads
DROP POLICY IF EXISTS "Public can read verification codes" ON public.email_verification_codes;
DROP POLICY IF EXISTS "Anyone can view verification codes" ON public.email_verification_codes;
DROP POLICY IF EXISTS "Users can view verification codes" ON public.email_verification_codes;

-- Ensure admins can manage the table (for monitoring/cleanup)
DROP POLICY IF EXISTS "Admins can manage verification codes" ON public.email_verification_codes;

CREATE POLICY "Admins can manage verification codes"
  ON public.email_verification_codes
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- The anonymous INSERT policy stays as-is (needed for code requests)
-- No SELECT policy for anon or non-admin authenticated users = denied by default
