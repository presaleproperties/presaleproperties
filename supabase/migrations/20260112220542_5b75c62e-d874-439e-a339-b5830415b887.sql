-- Add new columns to existing email_templates table
ALTER TABLE public.email_templates 
  ADD COLUMN IF NOT EXISTS template_key TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS audience_type TEXT DEFAULT 'buyer',
  ADD COLUMN IF NOT EXISTS variables JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS text_body TEXT;

-- Update existing templates with template_key
UPDATE public.email_templates SET template_key = 'welcome' WHERE template_type = 'welcome' AND template_key IS NULL;

-- Email Workflows Table
CREATE TABLE IF NOT EXISTS public.email_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  audience_type TEXT NOT NULL DEFAULT 'buyer',
  trigger_event TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Email Workflow Steps Table
CREATE TABLE IF NOT EXISTS public.email_workflow_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES public.email_workflows(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL DEFAULT 1,
  delay_minutes INTEGER NOT NULL DEFAULT 0,
  template_id UUID NOT NULL REFERENCES public.email_templates(id),
  send_condition JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Email Jobs Queue Table
CREATE TABLE IF NOT EXISTS public.email_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  to_email TEXT NOT NULL,
  to_name TEXT,
  template_id UUID NOT NULL REFERENCES public.email_templates(id),
  workflow_id UUID REFERENCES public.email_workflows(id),
  variables JSONB DEFAULT '{}'::jsonb,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'queued',
  error_message TEXT,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_jobs ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admins can manage email workflows" ON public.email_workflows
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage workflow steps" ON public.email_workflow_steps
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage email jobs" ON public.email_jobs
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_workflows_trigger ON public.email_workflows(trigger_event);
CREATE INDEX IF NOT EXISTS idx_email_workflow_steps_workflow ON public.email_workflow_steps(workflow_id);
CREATE INDEX IF NOT EXISTS idx_email_jobs_status ON public.email_jobs(status);
CREATE INDEX IF NOT EXISTS idx_email_jobs_scheduled ON public.email_jobs(scheduled_at) WHERE status = 'queued';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_email_workflows_updated_at ON public.email_workflows;
CREATE TRIGGER update_email_workflows_updated_at
  BEFORE UPDATE ON public.email_workflows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();