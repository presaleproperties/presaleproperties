# OG Social Sharing — Status

## ✅ Done (backend)
- `og-snapshot` edge function returns per-page meta for homepage, project pages, listings, blog, deck, etc.
- Verified live: `curl -A "facebookexternalhit/1.1" "https://thvlisplwqhtjpzpedhq.supabase.co/functions/v1/og-snapshot?path=/&force=1"` returns correct HTML.
- `cloudflare-worker/wrangler.toml` routes are uncommented and ready.

## ⏳ Single remaining step (must be done by site owner)
Deploy the Cloudflare Worker. Detailed walkthrough: `cloudflare-worker/DEPLOY.md`

```bash
npm install -g wrangler
wrangler login
cd cloudflare-worker && wrangler deploy
```

This requires a Cloudflare login and **cannot be done from Lovable's environment** — it's a one-time owner action.

## Why this is the only path
- Lovable hosting is a static SPA. Crawlers (WhatsApp, iMessage, Facebook, LinkedIn, etc.) don't run JavaScript, so per-page Helmet tags are invisible to them.
- Lovable hosting does not support `_headers`, `_redirects`, or middleware.
- The Cloudflare Worker sits in front of the domain, intercepts crawler User-Agents, and serves prerendered meta from the backend.
