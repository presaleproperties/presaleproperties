# OG Proxy — Cloudflare Worker

Routes social-media crawler requests for `presaleproperties.com/*` to the
`og-preview` Supabase edge function, so iMessage / WhatsApp / Slack /
Facebook / Twitter / LinkedIn unfurls show per-page Open Graph metadata
instead of the homepage card. Real users pass through to Lovable hosting
unchanged.

## Files

- `og-proxy.js` — the Worker. Detects bot User-Agents and proxies to
  `https://thvlisplwqhtjpzpedhq.supabase.co/functions/v1/og-preview?path=...`.
- `wrangler.toml` — deploy config. The route block is commented out — set
  your zone before deploying.

## Deploy

1. **Install Wrangler**
   ```bash
   npm install -g wrangler
   ```
2. **Login to Cloudflare**
   ```bash
   wrangler login
   ```
3. **Enable the route** in `wrangler.toml` — uncomment `[triggers]` and set
   `pattern` / `zone_name` to your live domain:
   ```toml
   [triggers]
   routes = [
     { pattern = "presaleproperties.com/*", zone_name = "presaleproperties.com" }
   ]
   ```
4. **Deploy**
   ```bash
   cd cloudflare-worker
   wrangler deploy
   ```

## Verify

After deploy, paste a project, blog, or developer URL into:

- Facebook Sharing Debugger → https://developers.facebook.com/tools/debug/
- LinkedIn Post Inspector → https://www.linkedin.com/post-inspector/
- Send a link in WhatsApp / iMessage and confirm the preview card.

You should see the page-specific title, description, and image — not the
homepage card.

## How it works

1. Request hits `presaleproperties.com/<path>`.
2. Worker inspects `User-Agent`. Static assets (`.js`, `.png`, …) and
   non-GET requests pass straight to origin.
3. If UA matches a known crawler (Facebook, Twitter, LinkedIn, WhatsApp,
   Slack, Discord, iMessage/Applebot, etc.) → proxy to the `og-preview`
   function with `?path=<original path>`.
4. Otherwise → pass through to Lovable origin so the SPA loads normally.

The edge function already handles cache headers (ETag, `stale-while-
revalidate`) and supports `?fresh=1` for admin re-share flows.
