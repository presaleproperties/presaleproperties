-- Create function to update listing agent/office names from cached data
CREATE OR REPLACE FUNCTION public.update_listing_agent_names()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update agent names
  UPDATE mls_listings l
  SET list_agent_name = a.full_name
  FROM mls_agents a
  WHERE l.list_agent_key = a.agent_key
    AND l.list_agent_name IS NULL
    AND a.full_name IS NOT NULL;

  -- Update office names
  UPDATE mls_listings l
  SET list_office_name = o.office_name
  FROM mls_offices o
  WHERE l.list_office_key = o.office_key
    AND l.list_office_name IS NULL
    AND o.office_name IS NOT NULL;
END;
$$;