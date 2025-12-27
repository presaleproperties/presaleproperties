-- Drop the overly permissive policy that exposes all profile data to anyone
DROP POLICY IF EXISTS "Anyone can view agent profiles for published listings" ON public.profiles;