-- Add 'developer' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'developer';

-- Create developer_profiles table
CREATE TABLE public.developer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    company_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    phone TEXT,
    website_url TEXT,
    logo_url TEXT,
    verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
    verification_notes TEXT,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.developer_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for developer_profiles
CREATE POLICY "Admins can manage all developer profiles"
ON public.developer_profiles
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Developers can view own profile"
ON public.developer_profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Developers can update own profile"
ON public.developer_profiles
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert developer profile during signup"
ON public.developer_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_developer_profiles_updated_at
BEFORE UPDATE ON public.developer_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();