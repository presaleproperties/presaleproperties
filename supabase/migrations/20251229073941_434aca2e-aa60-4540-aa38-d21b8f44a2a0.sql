-- PHASE 1: Data Quality & Trust Fields
-- Add last_verified_date and info_source for trust signals
ALTER TABLE public.presale_projects 
ADD COLUMN IF NOT EXISTS last_verified_date date DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS info_source text DEFAULT 'Public Disclosure';

-- PHASE 2: Enhanced Filter Fields
-- Add decision-grade filter fields
ALTER TABLE public.presale_projects 
ADD COLUMN IF NOT EXISTS deposit_percent integer,
ADD COLUMN IF NOT EXISTS assignment_allowed text DEFAULT 'Unknown',
ADD COLUMN IF NOT EXISTS near_skytrain boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS rental_restrictions text DEFAULT 'Unknown',
ADD COLUMN IF NOT EXISTS incentives_available boolean DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN public.presale_projects.last_verified_date IS 'Date when project info was last verified';
COMMENT ON COLUMN public.presale_projects.info_source IS 'Source of information: Builder, Sales Centre, Public Disclosure, Agent Verified';
COMMENT ON COLUMN public.presale_projects.deposit_percent IS 'Total deposit percentage required (5, 10, 15, 20, 25+)';
COMMENT ON COLUMN public.presale_projects.assignment_allowed IS 'Whether assignments are allowed: Yes, No, Unknown';
COMMENT ON COLUMN public.presale_projects.near_skytrain IS 'Whether project is within walking distance of SkyTrain';
COMMENT ON COLUMN public.presale_projects.rental_restrictions IS 'Rental policy: Allowed, Restricted, Unknown';
COMMENT ON COLUMN public.presale_projects.incentives_available IS 'Whether developer incentives are currently available';

-- Add index for faster filtering on new columns
CREATE INDEX IF NOT EXISTS idx_presale_projects_deposit_percent ON public.presale_projects(deposit_percent);
CREATE INDEX IF NOT EXISTS idx_presale_projects_assignment_allowed ON public.presale_projects(assignment_allowed);
CREATE INDEX IF NOT EXISTS idx_presale_projects_near_skytrain ON public.presale_projects(near_skytrain);
CREATE INDEX IF NOT EXISTS idx_presale_projects_last_verified ON public.presale_projects(last_verified_date);

-- Add "Registering" status to project_status enum
-- First check if it exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'registering' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'project_status')) THEN
        ALTER TYPE public.project_status ADD VALUE 'registering' AFTER 'coming_soon';
    END IF;
END$$;