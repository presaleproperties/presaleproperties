-- Drop crm_showings first (has FK to crm_leads)
DROP TABLE IF EXISTS public.crm_showings CASCADE;

-- Drop remaining CRM tables
DROP TABLE IF EXISTS public.crm_leads CASCADE;
DROP TABLE IF EXISTS public.crm_email_campaigns CASCADE;
DROP TABLE IF EXISTS public.crm_templates CASCADE;
DROP TABLE IF EXISTS public.crm_automations CASCADE;