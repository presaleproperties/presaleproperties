DROP POLICY IF EXISTS "Team members can view own team_members row" ON public.team_members;
CREATE POLICY "Team members can view own team_members row"
  ON public.team_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Team members can update own team_members row" ON public.team_members;
CREATE POLICY "Team members can update own team_members row"
  ON public.team_members FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());