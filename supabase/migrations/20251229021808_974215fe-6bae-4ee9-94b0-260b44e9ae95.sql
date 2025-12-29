-- Create email templates table
CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL,
  html_content text NOT NULL,
  template_type text NOT NULL DEFAULT 'welcome', -- 'welcome', 'followup', 'campaign'
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create email campaigns table
CREATE TABLE public.email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL,
  html_content text NOT NULL,
  project_id uuid REFERENCES public.presale_projects(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft', -- 'draft', 'scheduled', 'sent'
  scheduled_at timestamptz,
  sent_at timestamptz,
  recipient_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create email logs table for tracking
CREATE TABLE public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.project_leads(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES public.email_campaigns(id) ON DELETE SET NULL,
  template_type text,
  email_to text NOT NULL,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'sent', -- 'sent', 'failed', 'opened', 'clicked'
  error_message text,
  sent_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies - admin only for all tables
CREATE POLICY "Admins can manage email templates"
ON public.email_templates FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage email campaigns"
ON public.email_campaigns FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view email logs"
ON public.email_logs FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Update triggers
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_campaigns_updated_at
BEFORE UPDATE ON public.email_campaigns
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default welcome template
INSERT INTO public.email_templates (name, subject, html_content, template_type) VALUES (
  'Project Welcome Email',
  'Welcome! Here''s Your {{project_name}} Information',
  '<h1>Thank you for your interest in {{project_name}}</h1>
<p>Hi {{lead_name}},</p>
<p>We''re excited that you''re interested in {{project_name}} located in {{project_city}}.</p>
<p>Attached you''ll find:</p>
<ul>
  <li>Floor plans</li>
  <li>Pricing information</li>
  <li>Project details</li>
</ul>
<p>A member of our team will reach out shortly to answer any questions.</p>
<p>Best regards,<br>PresaleProperties.com</p>',
  'welcome'
);