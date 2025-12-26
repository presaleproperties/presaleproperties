
-- Remove foreign key constraints on profiles and agent_profiles to allow demo data
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
ALTER TABLE agent_profiles DROP CONSTRAINT IF EXISTS agent_profiles_user_id_fkey;
