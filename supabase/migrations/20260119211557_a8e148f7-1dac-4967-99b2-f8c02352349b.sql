-- Create landing_page_campaigns table for managing ad landing pages
CREATE TABLE public.landing_page_campaigns (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    project_id UUID REFERENCES public.presale_projects(id) ON DELETE SET NULL,
    headline TEXT,
    subheadline TEXT,
    selling_points TEXT[],
    urgency_badge TEXT DEFAULT 'Limited Time Offer',
    urgency_text TEXT DEFAULT 'Pre-construction pricing available for a limited time',
    cta_text TEXT DEFAULT 'Get Floor Plans & Pricing',
    location_teaser TEXT,
    video_url TEXT,
    incentive_savings TEXT DEFAULT '$50K',
    incentive_deposit TEXT DEFAULT '5%',
    incentive_bonus TEXT DEFAULT 'Free A/C',
    monthly_1br TEXT DEFAULT '~$1,950',
    monthly_2br TEXT DEFAULT '~$2,600',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.landing_page_campaigns ENABLE ROW LEVEL SECURITY;

-- Allow public read for active campaigns
CREATE POLICY "Anyone can view active campaigns"
ON public.landing_page_campaigns
FOR SELECT
USING (is_active = true);

-- Allow admins full access
CREATE POLICY "Admins can manage campaigns"
ON public.landing_page_campaigns
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_landing_page_campaigns_updated_at
BEFORE UPDATE ON public.landing_page_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();