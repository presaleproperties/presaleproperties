-- Create pitch_decks table
CREATE TABLE public.pitch_decks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  project_name TEXT NOT NULL DEFAULT '',
  tagline TEXT,
  city TEXT,
  address TEXT,
  developer_name TEXT,
  stories INTEGER,
  total_units INTEGER,
  completion_year TEXT,
  hero_image_url TEXT,
  floor_plans JSONB NOT NULL DEFAULT '[]'::jsonb,
  gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
  proximity_highlights JSONB NOT NULL DEFAULT '[]'::jsonb,
  projections JSONB NOT NULL DEFAULT '{}'::jsonb,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  contact_whatsapp TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pitch_decks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published decks are publicly viewable"
  ON public.pitch_decks FOR SELECT
  USING (is_published = true OR auth.uid() = user_id);

CREATE POLICY "Owners can insert pitch decks"
  ON public.pitch_decks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update pitch decks"
  ON public.pitch_decks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can delete pitch decks"
  ON public.pitch_decks FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all pitch decks"
  ON public.pitch_decks FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_pitch_decks_updated_at
  BEFORE UPDATE ON public.pitch_decks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_pitch_decks_slug ON public.pitch_decks(slug);
CREATE INDEX idx_pitch_decks_user_id ON public.pitch_decks(user_id);