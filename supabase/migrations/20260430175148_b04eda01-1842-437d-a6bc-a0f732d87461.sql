ALTER TABLE public.campaign_templates
  ALTER COLUMN slug SET DEFAULT gen_random_uuid()::text,
  ALTER COLUMN owner_scope SET DEFAULT 'team:presale';