ALTER TABLE public.campaign_templates ADD COLUMN IF NOT EXISTS is_favorited boolean DEFAULT false;
ALTER TABLE public.campaign_templates ADD COLUMN IF NOT EXISTS last_sent_at timestamptz DEFAULT NULL;