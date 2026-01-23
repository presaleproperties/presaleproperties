-- Create subscription tiers enum
CREATE TYPE public.agent_subscription_tier AS ENUM ('none', 'core', 'pro', 'elite');

-- Create agent_subscriptions table to track active subscriptions
CREATE TABLE public.agent_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier agent_subscription_tier NOT NULL DEFAULT 'none',
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'past_due', 'cancelled')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create saved_assignments table for agents to save favorite assignments
CREATE TABLE public.saved_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, listing_id)
);

-- Create assignment_inquiries table for agent-to-agent contact
CREATE TABLE public.assignment_inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  from_agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'read', 'replied')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_inquiries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agent_subscriptions
CREATE POLICY "Users can view their own subscription"
ON public.agent_subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
ON public.agent_subscriptions FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for saved_assignments
CREATE POLICY "Users can view their own saved assignments"
ON public.saved_assignments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can save assignments"
ON public.saved_assignments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their saved assignments"
ON public.saved_assignments FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for assignment_inquiries
CREATE POLICY "Agents can view inquiries they sent or received"
ON public.assignment_inquiries FOR SELECT
USING (auth.uid() = from_agent_id OR auth.uid() = to_agent_id);

CREATE POLICY "Agents can send inquiries"
ON public.assignment_inquiries FOR INSERT
WITH CHECK (auth.uid() = from_agent_id);

CREATE POLICY "Agents can update inquiries they received"
ON public.assignment_inquiries FOR UPDATE
USING (auth.uid() = to_agent_id);

-- Triggers for updated_at
CREATE TRIGGER update_agent_subscriptions_updated_at
BEFORE UPDATE ON public.agent_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assignment_inquiries_updated_at
BEFORE UPDATE ON public.assignment_inquiries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();