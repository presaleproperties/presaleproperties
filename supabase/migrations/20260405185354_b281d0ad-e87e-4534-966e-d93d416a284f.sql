
-- Step type enum
CREATE TYPE public.automation_step_type AS ENUM (
  'delay',
  'send_email',
  'send_sms',
  'send_whatsapp',
  'condition'
);

-- Automation flows table
CREATE TABLE public.automation_flows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  description TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_flows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage automation flows"
  ON public.automation_flows FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Block anon access to automation flows"
  ON public.automation_flows FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Automation steps table
CREATE TABLE public.automation_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flow_id UUID NOT NULL REFERENCES public.automation_flows(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL DEFAULT 0,
  step_type public.automation_step_type NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage automation steps"
  ON public.automation_steps FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Block anon access to automation steps"
  ON public.automation_steps FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Index for fast step lookups
CREATE INDEX idx_automation_steps_flow_id ON public.automation_steps(flow_id, step_order);

-- Updated_at triggers
CREATE TRIGGER update_automation_flows_updated_at
  BEFORE UPDATE ON public.automation_flows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_automation_steps_updated_at
  BEFORE UPDATE ON public.automation_steps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
