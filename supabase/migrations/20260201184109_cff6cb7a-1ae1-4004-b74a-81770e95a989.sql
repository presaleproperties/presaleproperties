-- Create team_members table
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  title TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  photo_url TEXT,
  bio TEXT,
  linkedin_url TEXT,
  instagram_url TEXT,
  specializations TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Anyone can view active team members (for public display)
CREATE POLICY "Anyone can view active team members"
ON public.team_members
FOR SELECT
USING (is_active = true);

-- Admins can manage all team members
CREATE POLICY "Admins can manage team members"
ON public.team_members
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_team_members_updated_at
BEFORE UPDATE ON public.team_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial team data from About page
INSERT INTO public.team_members (full_name, title, bio, specializations, sort_order) VALUES
('Sarah Chen', 'Founder & Lead Agent', 'With over a decade of experience in Metro Vancouver''s presale market, Sarah has helped hundreds of families find their perfect new construction home.', ARRAY['Presale Condos', 'Investment Properties', 'First-Time Buyers'], 1),
('Michael Rodriguez', 'First-Time Buyer Specialist', 'Michael specializes in guiding first-time buyers through the presale process, making the journey to homeownership smooth and stress-free.', ARRAY['First-Time Buyers', 'Townhomes', 'Mortgage Guidance'], 2),
('Priya Sharma', 'Investor Relations', 'Priya brings a wealth of knowledge in real estate investment, helping clients build strong portfolios through strategic presale purchases.', ARRAY['Investment Analysis', 'Portfolio Building', 'Market Research'], 3);