-- Create table to cache MLS agent data
CREATE TABLE public.mls_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_key TEXT NOT NULL UNIQUE,
  agent_mls_id TEXT,
  full_name TEXT,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  office_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table to cache MLS office data
CREATE TABLE public.mls_offices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  office_key TEXT NOT NULL UNIQUE,
  office_mls_id TEXT,
  office_name TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for fast lookups
CREATE INDEX idx_mls_agents_agent_key ON public.mls_agents(agent_key);
CREATE INDEX idx_mls_offices_office_key ON public.mls_offices(office_key);
CREATE INDEX idx_mls_agents_office_key ON public.mls_agents(office_key);

-- Enable RLS (public read, no public write)
ALTER TABLE public.mls_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mls_offices ENABLE ROW LEVEL SECURITY;

-- Public can read agent/office info
CREATE POLICY "Anyone can view mls agents" 
ON public.mls_agents FOR SELECT USING (true);

CREATE POLICY "Anyone can view mls offices" 
ON public.mls_offices FOR SELECT USING (true);

-- Add triggers for updated_at
CREATE TRIGGER update_mls_agents_updated_at
BEFORE UPDATE ON public.mls_agents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mls_offices_updated_at
BEFORE UPDATE ON public.mls_offices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();