CREATE OR REPLACE FUNCTION public.team_members_autofill_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.agent_slug IS NULL OR NEW.agent_slug = '' THEN
    NEW.agent_slug := trim(both '-' from lower(regexp_replace(NEW.full_name, '[^a-zA-Z0-9]+', '-', 'g')));
  END IF;
  -- Lock slug after creation: keep OLD value on UPDATE
  IF TG_OP = 'UPDATE' AND OLD.agent_slug IS NOT NULL AND OLD.agent_slug <> '' THEN
    NEW.agent_slug := OLD.agent_slug;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS team_members_autofill_slug_trg ON public.team_members;
CREATE TRIGGER team_members_autofill_slug_trg
  BEFORE INSERT OR UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.team_members_autofill_slug();

ALTER TABLE public.team_members
  ALTER COLUMN agent_slug DROP NOT NULL;