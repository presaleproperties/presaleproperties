-- Add view_count column to presale_projects
ALTER TABLE public.presale_projects 
ADD COLUMN view_count integer NOT NULL DEFAULT 0;

-- Create index for faster sorting by views
CREATE INDEX idx_presale_projects_view_count ON public.presale_projects(view_count DESC);

-- Create a function to increment view count
CREATE OR REPLACE FUNCTION public.increment_project_view(project_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE presale_projects 
  SET view_count = view_count + 1
  WHERE id = project_id;
END;
$$;

-- Grant execute permission to anon and authenticated users
GRANT EXECUTE ON FUNCTION public.increment_project_view(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_project_view(uuid) TO authenticated;