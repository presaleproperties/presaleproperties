
-- Disable the broken blog image generation trigger that blocks inserts
DROP TRIGGER IF EXISTS on_blog_post_published ON public.blog_posts;
