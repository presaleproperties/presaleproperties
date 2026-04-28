# Deploy the OG Proxy Worker — 5 minutes

The backend (`og-snapshot` / `og-preview` edge functions) is **already live** and tested. The only remaining step is publishing the Cloudflare Worker that intercepts crawler traffic on `presaleproperties.com` and routes it to the backend.

## Prerequisites
- A Cloudflare account with `presaleproperties.com` added as a zone
- Node.js installed locally

## Steps

```bash
# 1. Install Wrangler globally (one-time)
npm install -g wrangler

# 2. Login to Cloudflare (opens browser)
wrangler login

# 3. From this folder, deploy
cd cloudflare-worker
wrangler deploy
```

That's it. Wrangler reads `wrangler.toml` and binds the routes:
- `presaleproperties.com/*`
- `www.presaleproperties.com/*`

## Verify it works (after deploy)

Paste any of these into Facebook's Sharing Debugger
(<https://developers.facebook.com/tools/debug/>):

- `https://presaleproperties.com/` (homepage)
- `https://presaleproperties.com/presale-projects/<any-published-slug>`
- `https://presaleproperties.com/blog/<any-published-slug>`

You should see the per-page title, description, and image — not the homepage.

Also test in iMessage and WhatsApp by sending a project link in a chat.

## How it works

1. Crawler fetches `presaleproperties.com/presale-projects/bromley`
2. Cloudflare Worker checks User-Agent — sees `facebookexternalhit`, `WhatsApp`, etc.
3. Worker proxies to `og-snapshot?path=/presale-projects/bromley`
4. Edge function looks up the project in Supabase, returns HTML with correct OG tags
5. Crawler shows the right preview card

Real users (non-bot UAs) pass straight through to Lovable hosting unchanged.

## Test that the backend already works

```bash
curl -A "facebookexternalhit/1.1" \
  "https://thvlisplwqhtjpzpedhq.supabase.co/functions/v1/og-snapshot?path=/&force=1"
```

You'll see a complete HTML response with proper `og:title`, `og:image`, etc.
