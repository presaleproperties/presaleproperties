-- Add strata_fees and assignment_fees columns to presale_projects table
ALTER TABLE public.presale_projects
ADD COLUMN strata_fees text,
ADD COLUMN assignment_fees text;