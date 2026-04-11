
ALTER TABLE public.email_logs
ADD COLUMN IF NOT EXISTS clicked_at timestamptz,
ADD COLUMN IF NOT EXISTS click_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_clicked_at timestamptz,
ADD COLUMN IF NOT EXISTS clicked_url text;
