-- Create table to store SEO health check results
CREATE TABLE public.seo_health_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  check_type TEXT NOT NULL, -- 'weekly_full', 'sitemap', 'canonical', 'indexation'
  status TEXT NOT NULL DEFAULT 'running', -- 'running', 'completed', 'failed'
  sitemap_url_count INTEGER,
  sitemap_breakdown JSONB DEFAULT '{}'::jsonb,
  issues JSONB DEFAULT '[]'::jsonb, -- Array of detected issues
  warnings JSONB DEFAULT '[]'::jsonb, -- Array of warnings
  city_pages_status JSONB DEFAULT '{}'::jsonb, -- Status of each city page
  canonical_issues JSONB DEFAULT '[]'::jsonb, -- Canonical URL problems
  summary TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.seo_health_checks ENABLE ROW LEVEL SECURITY;

-- Admin-only access
CREATE POLICY "Admins can manage SEO health checks" 
ON public.seo_health_checks 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_seo_health_checks_created_at ON public.seo_health_checks(created_at DESC);
CREATE INDEX idx_seo_health_checks_check_type ON public.seo_health_checks(check_type);