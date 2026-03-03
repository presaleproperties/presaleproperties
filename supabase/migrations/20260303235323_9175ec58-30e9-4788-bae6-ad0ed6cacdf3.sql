
-- Fix team_members - drop existing permissive policy and recreate properly
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'team_members') THEN
    ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Anyone can view team members" ON public.team_members;
    DROP POLICY IF EXISTS "Public can view team members" ON public.team_members;
    DROP POLICY IF EXISTS "Anyone can view active team members" ON public.team_members;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'team_members' AND policyname = 'Anyone can view active team members') THEN
      CREATE POLICY "Anyone can view active team members" ON public.team_members
        FOR SELECT USING (is_active = true);
    END IF;
  END IF;
END $$;
