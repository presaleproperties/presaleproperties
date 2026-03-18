
-- ============================================================
-- SECURITY FIX 1: team_members — Remove broad public SELECT policy
-- that exposes real email addresses and phone numbers.
-- Public read access is already handled safely via team_members_public view.
-- ============================================================

-- Drop the overly permissive SELECT policy on the base table
DROP POLICY IF EXISTS "Anyone can view active team members" ON public.team_members;

-- Keep RLS enabled; admins can still read via their own policies
-- Public-facing queries must go through the team_members_public view

-- ============================================================
-- SECURITY FIX 2: project_leads — Restrict recent UPDATE policy
-- to only the original submitter identified by visitor_id or session_id.
-- Previously any anonymous user could overwrite any lead created in
-- the last 15 minutes if they guessed the UUID.
-- ============================================================

-- Drop the insecure open UPDATE policy
DROP POLICY IF EXISTS "Anyone can update recent project leads" ON public.project_leads;

-- Recreate it scoped to the original submitter via visitor_id or session_id
CREATE POLICY "Submitter can update own recent project lead"
  ON public.project_leads
  FOR UPDATE
  TO anon, authenticated
  USING (
    created_at > now() - interval '15 minutes'
    AND (
      (visitor_id IS NOT NULL AND visitor_id = current_setting('request.headers', true)::json->>'x-visitor-id')
      OR (session_id IS NOT NULL AND session_id = current_setting('request.headers', true)::json->>'x-session-id')
    )
  )
  WITH CHECK (
    created_at > now() - interval '15 minutes'
    AND (
      (visitor_id IS NOT NULL AND visitor_id = current_setting('request.headers', true)::json->>'x-visitor-id')
      OR (session_id IS NOT NULL AND session_id = current_setting('request.headers', true)::json->>'x-session-id')
    )
  );
