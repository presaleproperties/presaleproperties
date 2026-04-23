// supabase/functions/og-preview/index.ts
//
// Server-rendered Open Graph metadata for social sharing.
//
// Lovable/Vite is a single-page app — when iMessage / WhatsApp / Slack /
// Facebook / Twitter / LinkedIn fetch a URL, they don't run JS. They just
// read the static index.html and show whatever og:tags are baked in there
// (the homepage). That's why every shared link looks identical.
//
// This function:
//   1. Detects social-media crawler User-Agents
//   2. For known route patterns (project, listing, blog, deck, city, etc.)
//      it queries Supabase for the resource and returns minimal HTML with
//      a custom <title>, og:title, og:description, og:image, og:url
//   3. For non-crawlers it returns a 302 to the real SPA URL so humans
//      always end up at the actual app
//
// Wire this up at the CDN/host level by routing all incoming requests
// through it (or just call it client-side from a share button).
// Anyone with the function URL can use it; no auth required.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const SITE_ORIGIN = "https://presaleproperties.com";
const DEFAULT_IMAGE = `${SITE_ORIGIN}/og-image.png`;
const DEFAULT_TITLE = "Presale Properties — BC New Construction";
const DEFAULT_DESC =
  "Browse Metro Vancouver presale condos, townhomes & move-in ready homes with VIP pricing, floor plans, and developer incentives.";

const CRAWLER_UA_PATTERNS = [
  /facebookexternalhit/i,
  /facebot/i,
  /twitterbot/i,
  /linkedinbot/i,
  /slackbot/i,
  /discordbot/i,
  /telegrambot/i,
  /whatsapp/i,
  /skypeuripreview/i,
  /pinterest/i,
  /redditbot/i,
  /applebot/i,
  /vkshare/i,
  /quora link preview/i,
  /yahoo/i,
  /bingbot/i,
  /googlebot/i,
  /embedly/i,
  /iframely/i,
  /preview/i,
];

function isCrawler(ua: string | null) {
  if (!ua) return false;
  return CRAWLER_UA_PATTERNS.some((p) => p.test(ua));
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface Meta {
  title: string;
  description: string;
  image: string;
  url: string;
  type?: string;
}

function renderHtml(meta: Meta) {
  const t = escapeHtml(meta.title);
  const d = escapeHtml(meta.description);
  const img = escapeHtml(meta.image);
  const url = escapeHtml(meta.url);
  const type = escapeHtml(meta.type ?? "website");

  // Crawlers only need <head>. We still include a meta-refresh so the
  // odd case of a real human hitting this URL ends up on the SPA.
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${t}</title>
  <meta name="description" content="${d}" />
  <link rel="canonical" href="${url}" />

  <meta property="og:title" content="${t}" />
  <meta property="og:description" content="${d}" />
  <meta property="og:image" content="${img}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${url}" />
  <meta property="og:type" content="${type}" />
  <meta property="og:site_name" content="Presale Properties" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${t}" />
  <meta name="twitter:description" content="${d}" />
  <meta name="twitter:image" content="${img}" />

  <meta http-equiv="refresh" content="0; url=${url}" />
  <link rel="alternate" href="${url}" />
</head>
<body>
  <p>Redirecting to <a href="${url}">${url}</a>…</p>
</body>
</html>`;
}

// ─── Route resolvers ──────────────────────────────────────────
// Each resolver returns Meta, or null if it couldn't find the resource.

async function resolveProject(supabase: any, slug: string, fullUrl: string): Promise<Meta | null> {
  const { data } = await supabase
    .from("presale_projects")
    .select("name, city, neighborhood, hero_image_url, gallery_images, description")
    .eq("slug", slug)
    .maybeSingle();
  if (!data) return null;
  const image = data.hero_image_url || (Array.isArray(data.gallery_images) && data.gallery_images[0]) || DEFAULT_IMAGE;
  const locale = [data.neighborhood, data.city].filter(Boolean).join(", ");
  return {
    title: `${data.name}${locale ? ` — ${locale}` : ""} | Presale Properties`,
    description:
      (data.description || "").slice(0, 200) ||
      `Floor plans, pricing, and VIP access for ${data.name}${locale ? ` in ${locale}` : ""}.`,
    image,
    url: fullUrl,
    type: "website",
  };
}

async function resolveListing(supabase: any, slug: string, fullUrl: string): Promise<Meta | null> {
  // Try by slug field first, then by id fallback
  const { data } = await supabase
    .from("listings")
    .select("title, project_name, city, neighborhood, featured_image, photos, description, beds, baths, assignment_price")
    .or(`slug.eq.${slug},id.eq.${slug}`)
    .maybeSingle();
  if (!data) return null;
  const image = data.featured_image || (Array.isArray(data.photos) && data.photos[0]) || DEFAULT_IMAGE;
  const price = data.assignment_price ? `$${Number(data.assignment_price).toLocaleString()}` : null;
  const specs = [
    data.beds ? `${data.beds} bed` : null,
    data.baths ? `${data.baths} bath` : null,
    price,
  ].filter(Boolean).join(" · ");
  return {
    title: `${data.title || data.project_name} | Presale Properties`,
    description:
      (data.description || "").slice(0, 200) ||
      `${specs}${data.city ? ` in ${data.city}` : ""}. Move-in ready presale assignment.`,
    image,
    url: fullUrl,
    type: "website",
  };
}

async function resolveBlog(supabase: any, slug: string, fullUrl: string): Promise<Meta | null> {
  const { data } = await supabase
    .from("blog_posts")
    .select("title, excerpt, seo_title, seo_description, featured_image")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (!data) return null;
  return {
    title: data.seo_title || data.title,
    description: (data.seo_description || data.excerpt || "").slice(0, 200) || DEFAULT_DESC,
    image: data.featured_image || DEFAULT_IMAGE,
    url: fullUrl,
    type: "article",
  };
}

async function resolveDeck(supabase: any, slug: string, fullUrl: string): Promise<Meta | null> {
  const { data } = await supabase
    .from("pitch_decks")
    .select("project_name, hero_image_url")
    .eq("slug", slug)
    .maybeSingle();
  if (!data) return null;
  return {
    title: `${data.project_name} — VIP Pricing & Floor Plans | Presale Properties`,
    description: `Exclusive VIP package for ${data.project_name} — pricing, floor plans, deposit structure, and developer incentives.`,
    image: data.hero_image_url || DEFAULT_IMAGE,
    url: fullUrl,
    type: "website",
  };
}

async function resolveDeveloper(supabase: any, slug: string, fullUrl: string): Promise<Meta | null> {
  const { data } = await supabase
    .from("developers")
    .select("name, description, logo_url, city")
    .eq("slug", slug)
    .maybeSingle();
  if (!data) return null;
  return {
    title: `${data.name} — Vancouver Developer | Presale Properties`,
    description:
      (data.description || "").slice(0, 200) ||
      `View all current and upcoming presale projects from ${data.name}${data.city ? ` in ${data.city}` : ""}.`,
    image: data.logo_url || DEFAULT_IMAGE,
    url: fullUrl,
    type: "website",
  };
}

// Static / templated routes that don't need a DB lookup.
function resolveStatic(pathname: string, fullUrl: string): Meta | null {
  const map: Record<string, { title: string; description: string }> = {
    "/": {
      title: "Presale Condos BC | VIP Pricing & Floor Plans | Presale Properties",
      description: DEFAULT_DESC,
    },
    "/presale-projects": {
      title: "BC Presale Projects — VIP Access & Floor Plans | Presale Properties",
      description: "Browse every active and upcoming presale condo, townhome, and rowhome project across Metro Vancouver.",
    },
    "/listings": {
      title: "Presale Assignment Listings — BC Marketplace | Presale Properties",
      description: "Move-in ready presale assignments and contract transfers across British Columbia.",
    },
    "/blog": {
      title: "BC Real Estate Blog — Presale Guides & Market Insights",
      description: "Expert guides on buying presale condos, market reports, and investment strategies for British Columbia.",
    },
    "/presale-process": {
      title: "How to Buy a Presale Condo in BC — 8-Step Guide",
      description: "A complete 8-step guide to buying a presale condo in BC, from pre-approval to receiving your keys.",
    },
    "/calculator": {
      title: "Presale Investment Calculator | Presale Properties",
      description: "Free cash-flow, mortgage, and ROI calculator for BC presale condo investors.",
    },
    "/about": {
      title: "About Presale Properties — Metro Vancouver's Specialists",
      description: "Meet Metro Vancouver's dedicated new-construction team. Free guidance, VIP pricing, and zero buyer fees.",
    },
    "/contact": {
      title: "Contact Presale Properties — BC New Construction Specialists",
      description: "Get in touch with Metro Vancouver's presale specialists. Free consultations, 7 days a week.",
    },
  };
  const hit = map[pathname];
  if (!hit) return null;
  return { ...hit, image: DEFAULT_IMAGE, url: fullUrl };
}

// ─── Handler ──────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    // Caller passes the original page path as ?path=/projects/foo
    const path = url.searchParams.get("path") || "/";
    const targetUrl = `${SITE_ORIGIN}${path}`;
    const ua = req.headers.get("user-agent");

    // Humans → straight to the SPA. No DB hit, no work.
    if (!isCrawler(ua)) {
      return Response.redirect(targetUrl, 302);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const pathname = new URL(targetUrl).pathname.replace(/\/+$/, "") || "/";
    const segments = pathname.split("/").filter(Boolean);

    let meta: Meta | null = null;

    // Pattern matching, most specific first
    if (segments[0] === "presale-projects" && segments[1]) {
      meta = await resolveProject(supabase, segments[1], targetUrl);
    } else if (segments[0] === "projects" && segments[1]) {
      meta = await resolveProject(supabase, segments[1], targetUrl);
    } else if (segments[0] === "listings" && segments[1]) {
      meta = await resolveListing(supabase, segments[1], targetUrl);
    } else if (segments[0] === "resale" && segments[1]) {
      meta = await resolveListing(supabase, segments[1], targetUrl);
    } else if (segments[0] === "blog" && segments[1] && segments[1] !== "category") {
      meta = await resolveBlog(supabase, segments[1], targetUrl);
    } else if (segments[0] === "deck" && segments[1]) {
      meta = await resolveDeck(supabase, segments[1], targetUrl);
    } else if (segments[0] === "developers" && segments[1]) {
      meta = await resolveDeveloper(supabase, segments[1], targetUrl);
    }

    // Fallback to static map, then to default
    if (!meta) meta = resolveStatic(pathname, targetUrl);
    if (!meta) {
      meta = {
        title: DEFAULT_TITLE,
        description: DEFAULT_DESC,
        image: DEFAULT_IMAGE,
        url: targetUrl,
        type: "website",
      };
    }

    return new Response(renderHtml(meta), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300, s-maxage=600",
      },
    });
  } catch (err) {
    console.error("og-preview error:", err);
    // Always fall back to default OG so a broken function doesn't break sharing
    const fallback = renderHtml({
      title: DEFAULT_TITLE,
      description: DEFAULT_DESC,
      image: DEFAULT_IMAGE,
      url: SITE_ORIGIN,
    });
    return new Response(fallback, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
    });
  }
});
