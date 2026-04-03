
-- Update handle_new_user to also create agent_profiles when metadata present
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Auto-create agent profile if signup includes agent metadata
  IF NEW.raw_user_meta_data->>'license_number' IS NOT NULL 
     AND length(NEW.raw_user_meta_data->>'license_number') > 0 THEN
    INSERT INTO public.agent_profiles (user_id, license_number, brokerage_name, brokerage_address, verification_status)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'license_number',
      COALESCE(NEW.raw_user_meta_data->>'brokerage_name', ''),
      NEW.raw_user_meta_data->>'brokerage_address',
      'unverified'
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Ensure trigger is attached (re-create if missing)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
