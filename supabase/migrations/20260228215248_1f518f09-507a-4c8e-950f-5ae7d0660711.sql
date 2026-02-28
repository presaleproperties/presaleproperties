
-- Add lead status tracking columns to project_leads table
ALTER TABLE public.project_leads
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS status_updated_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS status_notes text,
  ADD COLUMN IF NOT EXISTS assigned_to text;

-- Add a check constraint for valid status values
ALTER TABLE public.project_leads
  DROP CONSTRAINT IF EXISTS project_leads_status_check;

ALTER TABLE public.project_leads
  ADD CONSTRAINT project_leads_status_check
  CHECK (status IN ('new', 'contacted', 'qualified', 'unqualified', 'closed'));

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_project_leads_status ON public.project_leads(status);
