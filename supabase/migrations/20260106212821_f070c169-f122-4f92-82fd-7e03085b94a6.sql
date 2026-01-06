-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Anyone can submit project leads" ON public.project_leads;

-- Create a new permissive INSERT policy for public form submissions
CREATE POLICY "Anyone can submit project leads" 
ON public.project_leads 
FOR INSERT 
TO public
WITH CHECK (true);