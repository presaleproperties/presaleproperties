-- Create enums for project and blog status
CREATE TYPE public.project_status AS ENUM ('coming_soon', 'active', 'sold_out');
CREATE TYPE public.project_type AS ENUM ('condo', 'townhome', 'mixed');

-- Create presale_projects table
CREATE TABLE public.presale_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Core fields
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status project_status NOT NULL DEFAULT 'coming_soon',
  city TEXT NOT NULL,
  neighborhood TEXT NOT NULL,
  address TEXT,
  map_lat DECIMAL(10, 8),
  map_lng DECIMAL(11, 8),
  
  -- Developer / Product
  developer_name TEXT,
  project_type project_type NOT NULL DEFAULT 'condo',
  unit_mix TEXT,
  starting_price NUMERIC,
  price_range TEXT,
  deposit_structure TEXT,
  incentives TEXT,
  
  -- Dates
  completion_month INTEGER,
  completion_year INTEGER,
  occupancy_estimate TEXT,
  
  -- Content
  short_description TEXT,
  full_description TEXT,
  highlights TEXT[],
  amenities TEXT[],
  faq JSONB DEFAULT '[]'::jsonb,
  
  -- Media
  featured_image TEXT,
  gallery_images TEXT[],
  floorplan_files TEXT[],
  brochure_files TEXT[],
  
  -- SEO
  seo_title TEXT,
  seo_description TEXT,
  og_image TEXT,
  is_indexed BOOLEAN NOT NULL DEFAULT true,
  
  -- Publishing
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blog_posts table
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Core fields
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT,
  featured_image TEXT,
  
  -- Categorization
  category TEXT,
  tags TEXT[],
  
  -- Publishing
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  publish_date TIMESTAMP WITH TIME ZONE,
  
  -- SEO
  seo_title TEXT,
  seo_description TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_leads table for lead capture
CREATE TABLE public.project_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.presale_projects(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.presale_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_leads ENABLE ROW LEVEL SECURITY;

-- Presale Projects policies (admin-only management, public read for published)
CREATE POLICY "Admins can manage all projects" 
ON public.presale_projects 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view published projects" 
ON public.presale_projects 
FOR SELECT 
USING (is_published = true);

-- Blog Posts policies (admin-only management, public read for published)
CREATE POLICY "Admins can manage all blog posts" 
ON public.blog_posts 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view published blog posts" 
ON public.blog_posts 
FOR SELECT 
USING (is_published = true);

-- Project Leads policies
CREATE POLICY "Admins can view all project leads" 
ON public.project_leads 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can submit project leads" 
ON public.project_leads 
FOR INSERT 
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_presale_projects_slug ON public.presale_projects(slug);
CREATE INDEX idx_presale_projects_published ON public.presale_projects(is_published, is_featured);
CREATE INDEX idx_presale_projects_city ON public.presale_projects(city);
CREATE INDEX idx_presale_projects_status ON public.presale_projects(status);

CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX idx_blog_posts_published ON public.blog_posts(is_published, is_featured);
CREATE INDEX idx_blog_posts_category ON public.blog_posts(category);

-- Create triggers for updated_at
CREATE TRIGGER update_presale_projects_updated_at
BEFORE UPDATE ON public.presale_projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();