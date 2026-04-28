// Cloudflare Worker: Bot-detection proxy for OG meta tags
// Deploy this on your Cloudflare zone for presaleproperties.com
//
// Route: presaleproperties.com/*
// This worker intercepts requests from social media crawlers and proxies
// them to the Supabase og-prerender edge function for dynamic OG tags.
// Normal users pass through to the origin (Lovable hosting) unchanged.

const OG_FUNCTION_URL =
  "https://thvlisplwqhtjpzpedhq.supabase.co/functions/v1/og-preview";

const BOT_PATTERNS = [
  "facebookexternalhit",
  "facebot",
  "twitterbot",
  "linkedinbot",
  "whatsapp",
  "slackbot",
  "discordbot",
  "telegrambot",
  "pinterest",
  "applebot",
  "imessage",
  "vkshare",
  "embedly",
  "quora link preview",
  "showyoubot",
  "outbrain",
  "redditbot",
  "tumblr",
  "snap url preview service",
  "chatgpt-user",
  "gptbot",
  "claudebot",
  "perplexitybot",
  "bytespider",
];

// Only intercept page navigations, not static assets
const STATIC_EXT =
  /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|map|webp|avif|mp4|webm|pdf|json|xml|txt|zip)$/i;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Skip static assets
    if (STATIC_EXT.test(url.pathname)) {
      return fetch(request);
    }

    // Skip non-GET requests
    if (request.method !== "GET") {
      return fetch(request);
    }

    const ua = (request.headers.get("user-agent") || "").toLowerCase();
    const isBot = BOT_PATTERNS.some((p) => ua.includes(p));

    if (!isBot) {
      // Normal user — pass through to origin (Lovable hosting)
      return fetch(request);
    }

    // Bot detected — proxy to the OG preview function with the exact shared path.
    try {
      const originalPath = `${url.pathname}${url.search}`;
      const ogUrl = `${OG_FUNCTION_URL}?path=${encodeURIComponent(originalPath)}`;

      const ogResponse = await fetch(ogUrl, {
        headers: {
          "User-Agent": request.headers.get("user-agent") || "",
          Accept: "text/html",
        },
      });

      if (ogResponse.ok) {
        const html = await ogResponse.text();
        return new Response(html, {
          status: 200,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=86400",
            "X-Robots-Tag": "noarchive",
          },
        });
      }

      // If edge function fails, fall through to origin
      return fetch(request);
    } catch (err) {
      // On error, serve origin normally
      return fetch(request);
    }
  },
};
