-- Add rate limiting columns to email_verification_codes
ALTER TABLE email_verification_codes 
ADD COLUMN IF NOT EXISTS failed_attempts integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until timestamp with time zone DEFAULT NULL;

-- Index for efficient rate limiting queries
CREATE INDEX IF NOT EXISTS idx_email_verification_email_created 
ON email_verification_codes(email, created_at DESC);

-- Clean up old verification codes automatically (older than 24 hours)
-- This helps prevent database bloat from unused codes
CREATE INDEX IF NOT EXISTS idx_email_verification_cleanup 
ON email_verification_codes(created_at) 
WHERE verified_at IS NULL;