
-- Remove the foreign key constraint on agent_id so we can have sample listings without real users
ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_agent_id_fkey;
