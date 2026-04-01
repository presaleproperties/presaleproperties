-- Allow anonymous users to read active/pending MLS listings via the safe view
CREATE POLICY "Public can read active listings"
ON public.mls_listings
FOR SELECT
TO anon, authenticated
USING (mls_status IN ('Active', 'Pending'));