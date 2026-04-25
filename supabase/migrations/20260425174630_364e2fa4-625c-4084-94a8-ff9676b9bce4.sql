ALTER TABLE public.vip_registrations
  ADD COLUMN IF NOT EXISTS is_realtor BOOLEAN,
  ADD COLUMN IF NOT EXISTS working_with_realtor BOOLEAN;