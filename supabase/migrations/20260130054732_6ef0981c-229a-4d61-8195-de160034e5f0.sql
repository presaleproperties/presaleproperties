-- Security hardening migration

-- 1. Fix geocoding_logs - Service role bypasses RLS, so policy should be false
DROP POLICY IF EXISTS "Service role can manage geocoding logs" ON geocoding_logs;
CREATE POLICY "Service role only via bypass" ON geocoding_logs
  FOR ALL USING (false) WITH CHECK (false);

-- 2. Remove duplicate bookings policy (keep just one)
DROP POLICY IF EXISTS "Anyone can create their own booking" ON bookings;

-- 3. Add rate limiting considerations - Add created_at index for potential rate limiting queries
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_leads_created_at ON project_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_newsletter_created_at ON newsletter_subscribers(created_at);

-- 4. Tighten email_verification_codes - add index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_email_verification_expires ON email_verification_codes(expires_at);

-- 5. Ensure client_activity has proper index for analytics
CREATE INDEX IF NOT EXISTS idx_client_activity_created ON client_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_activity_visitor ON client_activity(visitor_id, created_at DESC);

-- 6. Add comment documentation for intentional public policies
COMMENT ON POLICY "Anyone can create bookings" ON bookings IS 'Intentional: Public booking form for consultations';
COMMENT ON POLICY "Anyone can submit project leads" ON project_leads IS 'Intentional: Public lead capture forms';
COMMENT ON POLICY "Anyone can insert leads" ON leads IS 'Intentional: Public inquiry forms for listings';
COMMENT ON POLICY "Anyone can subscribe to newsletter" ON newsletter_subscribers IS 'Intentional: Public newsletter signup';
COMMENT ON POLICY "Anyone can create support tickets" ON support_tickets IS 'Intentional: Public support ticket submission';
COMMENT ON POLICY "Allow activity tracking insert" ON client_activity IS 'Intentional: Anonymous analytics tracking';
COMMENT ON POLICY "Allow anonymous insert for code requests" ON email_verification_codes IS 'Intentional: OTP verification flow';