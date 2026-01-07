-- Create developers table
CREATE TABLE public.developers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  website_url TEXT,
  logo_url TEXT,
  description TEXT,
  city TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  project_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.developers ENABLE ROW LEVEL SECURITY;

-- Anyone can view active developers
CREATE POLICY "Anyone can view active developers"
  ON public.developers
  FOR SELECT
  USING (is_active = true);

-- Admins can manage developers
CREATE POLICY "Admins can manage developers"
  ON public.developers
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add developer_id foreign key to presale_projects
ALTER TABLE public.presale_projects
  ADD COLUMN developer_id UUID REFERENCES public.developers(id);

-- Create index for faster lookups
CREATE INDEX idx_presale_projects_developer_id ON public.presale_projects(developer_id);
CREATE INDEX idx_developers_slug ON public.developers(slug);

-- Create trigger for updated_at
CREATE TRIGGER update_developers_updated_at
  BEFORE UPDATE ON public.developers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();