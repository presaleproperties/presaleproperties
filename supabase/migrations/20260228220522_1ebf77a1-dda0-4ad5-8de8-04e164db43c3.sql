-- Drop old incorrectly named columns
ALTER TABLE project_leads DROP COLUMN IF EXISTS status;
ALTER TABLE project_leads DROP COLUMN IF EXISTS status_notes;
ALTER TABLE project_leads DROP COLUMN IF EXISTS status_updated_at;
ALTER TABLE project_leads DROP COLUMN IF EXISTS assigned_to;

-- Add the 2 missing columns
ALTER TABLE project_leads ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE project_leads ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;