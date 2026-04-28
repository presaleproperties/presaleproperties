-- Delete historical email_jobs tied to legacy templates (test sends from setup)
DELETE FROM public.email_jobs
WHERE template_id IN (SELECT id FROM public.email_templates WHERE is_active = false);

-- Remove workflow steps referencing inactive legacy templates
DELETE FROM public.email_workflow_steps
WHERE template_id IN (SELECT id FROM public.email_templates WHERE is_active = false);

-- Clean up legacy auto-email templates (superseded by code-based system emails)
DELETE FROM public.email_templates WHERE is_active = false;

-- Dedupe campaign_templates: remove older copies
DELETE FROM public.campaign_templates WHERE id IN (
  '68459331-3f23-4eff-b91d-b2eb36ab7cff',
  '3165ec5e-a3d9-421b-a77f-3a85c393ee71',
  'b151a9d3-dd3d-465c-8eea-38c1c3d036b9'
);