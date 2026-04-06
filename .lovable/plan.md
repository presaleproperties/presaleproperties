## 🔧 TODO: Deploy Cloudflare Worker for Social Sharing OG Tags

The `og-prerender` edge function is built, deployed, and tested. The Cloudflare Worker code is ready at `cloudflare-worker/og-proxy.js`. These steps remain:

### Deployment Steps
1. **Install Wrangler CLI** — `npm install -g wrangler`
2. **Login to Cloudflare** — `wrangler login`
3. **Uncomment routes** in `cloudflare-worker/wrangler.toml` and set your zone name
4. **Deploy the Worker** — `cd cloudflare-worker && wrangler deploy`

### Verification Steps
5. **Test with Facebook Sharing Debugger** — paste a blog/project URL into https://developers.facebook.com/tools/debug/
6. **Test with LinkedIn Post Inspector** — paste a URL into https://www.linkedin.com/post-inspector/
7. **Test WhatsApp** — send a project link in a WhatsApp chat and confirm the preview card shows the correct title, image, and description
8. **Test iMessage** — send a link in iMessage and verify the rich preview

### Pages Covered
- ✅ Blog posts (`/blog/:slug`) — title, excerpt, featured image
- ✅ Presale projects (SEO URLs + legacy `/presale-projects/:slug`) — project name, price, hero image
- ✅ Developer profiles (`/developers/:slug`) — developer name, description, logo
- ✅ City pages (`/surrey-presale-condos`, etc.) — city name, type
- ✅ All other pages — default homepage OG tags
