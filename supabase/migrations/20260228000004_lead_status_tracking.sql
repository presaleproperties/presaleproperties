-- Add lead status tracking and admin notes to project_leads
-- These are the key missing CRM features for the admin portal

-- Lead status: new → contacted → qualified → converted | dead
ALTER TABLE project_leads
  ADD COLUMN IF NOT EXISTS lead_status TEXT NOT NULL DEFAULT 'new'
    CHECK (lead_status IN ('new', 'contacted', 'qualified', 'converted', 'dead')),
  ADD COLUMN IF NOT EXISTS admin_notes TEXT,
  ADD COLUMN IF NOT EXISTS contacted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_project_leads_status ON project_leads (lead_status);
CREATE INDEX IF NOT EXISTS idx_project_leads_created ON project_leads (created_at DESC);

-- Update existing leads: if intent_score >= 7 they're likely already in contact
-- This is a safe default — admin can re-classify
UPDATE project_leads
SET lead_status = 'new'
WHERE lead_status IS NULL;

COMMENT ON COLUMN project_leads.lead_status IS 'CRM workflow status: new, contacted, qualified, converted, dead';
COMMENT ON COLUMN project_leads.admin_notes IS 'Internal admin/agent notes about this lead (not visible to lead)';
COMMENT ON COLUMN project_leads.contacted_at IS 'Timestamp when lead was first contacted';
COMMENT ON COLUMN project_leads.converted_at IS 'Timestamp when lead converted (sale/signing)';
