-- Drop existing insert policy if it exists
DROP POLICY IF EXISTS "Anyone can submit project leads" ON public.project_leads;

-- Create a permissive insert policy that allows anyone (authenticated or anonymous) to submit leads
CREATE POLICY "Anyone can submit project leads" 
ON public.project_leads 
FOR INSERT 
TO public
WITH CHECK (true);