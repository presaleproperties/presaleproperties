-- Add lead_source column to differentiate lead types
ALTER TABLE public.project_leads 
ADD COLUMN lead_source TEXT DEFAULT 'floor_plan_request';

-- Add a comment for clarity
COMMENT ON COLUMN public.project_leads.lead_source IS 'Source of the lead: floor_plan_request, general_inquiry, etc.';