-- Add dedicated columns for home_size and agent_status
ALTER TABLE public.project_leads 
ADD COLUMN home_size text,
ADD COLUMN agent_status text;

-- Add comments for documentation
COMMENT ON COLUMN public.project_leads.home_size IS 'Interested home size: 1bed, 2bed, 3bed_plus';
COMMENT ON COLUMN public.project_leads.agent_status IS 'Agent status: no_agent, has_agent, is_agent';