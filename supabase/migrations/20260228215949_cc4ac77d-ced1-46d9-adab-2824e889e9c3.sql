ALTER TABLE project_leads ADD COLUMN IF NOT EXISTS lead_status TEXT NOT NULL DEFAULT 'new' CHECK (lead_status IN ('new', 'contacted', 'qualified', 'converted', 'dead'));
ALTER TABLE project_leads ADD COLUMN IF NOT EXISTS contacted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_leads_lead_status ON project_leads (lead_status);