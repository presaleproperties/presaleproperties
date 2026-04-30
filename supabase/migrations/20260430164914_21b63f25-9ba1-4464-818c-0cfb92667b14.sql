ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS team_members_user_id_idx ON public.team_members(user_id);