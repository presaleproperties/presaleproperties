# Project Rules

## Blog Post Workflow
- **MANDATORY**: Every new blog post MUST have an AI-generated featured image created BEFORE it is published.
- When the user provides a new blog post, generate a featured image using the `generate-blog-images` edge function or the AI image generation tools, then attach it to the blog post before setting `is_published = true`.
- Never publish a blog post without a featured image.
- **MANDATORY**: When a PDF source document contains real images (aerials, renderings, maps, diagrams, photos), extract them and embed into the blog post. Upload to Supabase storage (`blog-images/` bucket) with `<figure>/<img>` tags, alt text, and captions.
- **IMPORTANT**: Do NOT embed page screenshots or article layout captures from the PDF — only real photographic/illustrative content. If the PDF has no real images, generate 2-3 AI images based on the article content and embed those instead.

## Author Headshot
- The author headshot in the blog author card must always use `object-cover object-top` so the hair is never cut off and the face is properly centered within the circular frame. Use `w-16 h-16` minimum size.
