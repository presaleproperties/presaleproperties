# Project Rules

## Blog Post Workflow
- **MANDATORY**: Every new blog post MUST have an AI-generated featured image created BEFORE it is published.
- When the user provides a new blog post, generate a featured image using the `generate-blog-images` edge function or the AI image generation tools, then attach it to the blog post before setting `is_published = true`.
- Never publish a blog post without a featured image.
