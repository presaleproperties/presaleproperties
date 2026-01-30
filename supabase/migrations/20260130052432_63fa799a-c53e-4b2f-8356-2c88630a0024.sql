-- Enable pg_net extension for HTTP requests from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create function to trigger blog image generation
CREATE OR REPLACE FUNCTION public.trigger_blog_image_generation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  project_url TEXT := 'https://thvlisplwqhtjpzpedhq.supabase.co';
  service_key TEXT;
BEGIN
  -- Only trigger if featured_image is null and blog is published
  IF NEW.featured_image IS NULL AND NEW.is_published = true THEN
    -- Get the service role key from vault (if available) or use anon key
    SELECT decrypted_secret INTO service_key 
    FROM vault.decrypted_secrets 
    WHERE name = 'SUPABASE_SERVICE_ROLE_KEY'
    LIMIT 1;
    
    -- Queue the HTTP request to generate image
    PERFORM extensions.http_post(
      url := project_url || '/functions/v1/generate-blog-images',
      body := json_build_object('blogIds', ARRAY[NEW.id])::text,
      headers := json_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || COALESCE(service_key, current_setting('request.jwt.claim.sub', true))
      )::jsonb
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new blog posts
DROP TRIGGER IF EXISTS on_blog_post_published ON blog_posts;
CREATE TRIGGER on_blog_post_published
  AFTER INSERT OR UPDATE OF is_published ON blog_posts
  FOR EACH ROW
  WHEN (NEW.is_published = true AND NEW.featured_image IS NULL)
  EXECUTE FUNCTION public.trigger_blog_image_generation();