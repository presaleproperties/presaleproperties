-- Add DELETE policy for admins on project_leads table
CREATE POLICY "Admins can delete project leads"
ON public.project_leads
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));