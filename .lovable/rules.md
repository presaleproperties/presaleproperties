# Project Rules

## Blog Post Workflow
- **MANDATORY**: Every new blog post MUST have an AI-generated featured image created BEFORE it is published.
- When the user provides a new blog post, generate a featured image using the `generate-blog-images` edge function or the AI image generation tools, then attach it to the blog post before setting `is_published = true`.
- Never publish a blog post without a featured image.
- **MANDATORY**: When a PDF source document contains images (aerials, renderings, maps, diagrams, etc.), extract ALL images from the PDF and embed them into the blog post content. Upload extracted images to Supabase storage (`blog-images/` bucket) and reference them with `<figure>/<img>` tags including descriptive alt text and captions. Never discard source images — they add visual authority to the article.
