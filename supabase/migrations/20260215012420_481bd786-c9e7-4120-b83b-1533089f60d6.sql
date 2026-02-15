
-- Drop tables that depend on listings first (foreign keys)
DROP TABLE IF EXISTS public.assignment_inquiries CASCADE;
DROP TABLE IF EXISTS public.saved_assignments CASCADE;
DROP TABLE IF EXISTS public.expiration_notifications CASCADE;
DROP TABLE IF EXISTS public.listing_photos CASCADE;
DROP TABLE IF EXISTS public.listing_files CASCADE;
DROP TABLE IF EXISTS public.leads CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;

-- Drop the main listings table
DROP TABLE IF EXISTS public.listings CASCADE;

-- Drop agent-related tables
DROP TABLE IF EXISTS public.agent_profiles CASCADE;
DROP TABLE IF EXISTS public.agent_subscriptions CASCADE;

-- Drop agent-related enums (if not used elsewhere)
DROP TYPE IF EXISTS public.agent_verification_status CASCADE;
DROP TYPE IF EXISTS public.agent_subscription_tier CASCADE;
DROP TYPE IF EXISTS public.listing_status CASCADE;
DROP TYPE IF EXISTS public.construction_status CASCADE;
DROP TYPE IF EXISTS public.property_type CASCADE;
DROP TYPE IF EXISTS public.unit_type CASCADE;
DROP TYPE IF EXISTS public.visibility_mode CASCADE;

-- Drop the trigger function for expired listings
DROP FUNCTION IF EXISTS public.delete_listing_price_history() CASCADE;
