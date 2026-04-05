-- Add sent_by column to track which agent sent the email
ALTER TABLE public.email_logs ADD COLUMN sent_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Allow agents to read their own sent emails
CREATE POLICY "Agents can view their own sent emails"
ON public.email_logs
FOR SELECT
TO authenticated
USING (sent_by = auth.uid());
