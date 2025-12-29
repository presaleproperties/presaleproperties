-- Add qualifying fields to project_leads for nurture sequences
ALTER TABLE public.project_leads 
ADD COLUMN IF NOT EXISTS persona text,
ADD COLUMN IF NOT EXISTS timeline text,
ADD COLUMN IF NOT EXISTS budget text,
ADD COLUMN IF NOT EXISTS drip_sequence text DEFAULT 'buyer',
ADD COLUMN IF NOT EXISTS last_drip_sent integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS next_drip_at timestamp with time zone;

-- Create index for drip campaign queries
CREATE INDEX IF NOT EXISTS idx_project_leads_drip 
ON public.project_leads (next_drip_at, last_drip_sent) 
WHERE next_drip_at IS NOT NULL;