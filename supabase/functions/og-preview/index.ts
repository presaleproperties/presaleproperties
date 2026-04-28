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

// Map a crawler User-Agent to a normalized platform name for analytics.
function detectPlatform(ua: string | null): string {
  if (!ua) return "unknown";
  const u = ua.toLowerCase();
  if (u.includes("facebookexternalhit") || u.includes("facebot")) return "facebook";
  if (u.includes("twitterbot")) return "twitter";
  if (u.includes("linkedinbot")) return "linkedin";
  if (u.includes("whatsapp")) return "whatsapp";
  if (u.includes("slackbot")) return "slack";
  if (u.includes("discordbot")) return "discord";
  if (u.includes("telegrambot")) return "telegram";
  if (u.includes("skypeuripreview")) return "skype";
  if (u.includes("applebot")) return "imessage";
  if (u.includes("pinterest")) return "pinterest";
  if (u.includes("redditbot")) return "reddit";
  if (u.includes("vkshare")) return "vk";
  if (u.includes("quora")) return "quora";
  if (u.includes("embedly") || u.includes("iframely")) return "embedly";
  if (u.includes("googlebot")) return "google";
  if (u.includes("bingbot")) return "bing";
  return "other_bot";
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function ensureHttps(url?: string | null) {
  if (!url) return null;
  return url.startsWith("http://") ? url.replace("http://", "https://") : url;
}

function firstImage(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return ensureHttps(value);
  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === "string") return ensureHttps(item);
      if (!item || typeof item !== "object") continue;
      const photo = item as Record<string, unknown>;
      const url = photo.MediaURL || photo.media_url || photo.url || photo.src;
      if (url) return ensureHttps(String(url));
    }
  }
  return null;
}

function formatCad(value?: number | null) {
  if (!value) return null;
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function stripMarkdown(value?: string | null) {
  return (value || "").replace(/[#*_`>]/g, "").replace(/\s+/g, " ").trim();
}

interface Meta {
  title: string;
  description: string;
  image: string;
  url: string;
  type?: string;
  /** Last-modified timestamp of the underlying resource (ISO string). Used for ETag + Last-Modified. */
  updatedAt?: string;
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
    .select("name, city, neighborhood, featured_image, gallery_images, short_description, full_description, starting_price, updated_at")
    .eq("slug", slug)
    .maybeSingle();
  if (!data) return null;
  const image = ensureHttps(data.featured_image) || firstImage(data.gallery_images) || DEFAULT_IMAGE;
  const locale = [data.neighborhood, data.city].filter(Boolean).join(", ");
  const price = formatCad(data.starting_price);
  const fallback = `Floor plans, pricing, and VIP access for ${data.name}${locale ? ` in ${locale}` : ""}${price ? ` from ${price}` : ""}.`;
  return {
    title: `${data.name}${locale ? ` — ${locale}` : ""} | Presale Properties`,
    description:
      stripMarkdown(data.short_description || data.full_description).slice(0, 200) || fallback,
    image,
    url: fullUrl,
    type: "website",
    updatedAt: data.updated_at,
  };
}

async function resolveProjectFromSeoPath(supabase: any, pathname: string, fullUrl: string): Promise<Meta | null> {
  const match = pathname.replace(/^\//, "").match(/^(.+)-presale-(condos|townhomes|homes|duplexes)-(.+)$/);
  if (!match) return null;
  return resolveProject(supabase, match[3], fullUrl);
}

async function resolveListing(supabase: any, slug: string, fullUrl: string): Promise<Meta | null> {
  // Assignments are stored in public.listings and route as /assignments/:id.
  const { data } = await supabase
    .from("listings")
    .select("title, project_name, city, neighborhood, featured_image, photos, description, beds, baths, assignment_price, updated_at")
    .eq("id", slug)
    .maybeSingle();
  if (!data) return null;
  const image = ensureHttps(data.featured_image) || firstImage(data.photos) || DEFAULT_IMAGE;
  const price = formatCad(data.assignment_price);
  const specs = [
    data.beds ? `${data.beds} bed` : null,
    data.baths ? `${data.baths} bath` : null,
    price,
  ].filter(Boolean).join(" · ");
  return {
    title: `${data.title || data.project_name} | Presale Properties`,
    description:
      stripMarkdown(data.description).slice(0, 200) ||
      `${specs}${data.city ? ` in ${data.city}` : ""}. Move-in ready presale assignment.`,
    image,
    url: fullUrl,
    type: "website",
    updatedAt: data.updated_at,
  };
}

async function resolveResale(supabase: any, slug: string, fullUrl: string): Promise<Meta | null> {
  const listingKey = slug.match(/-(\d{6,})$/)?.[1] || (slug.match(/^\d{6,}$/) ? slug : null);
  if (!listingKey) return null;

  const { data } = await supabase
    .from("mls_listings_safe")
    .select("listing_key, listing_price, property_type, property_sub_type, city, neighborhood, unparsed_address, street_number, street_name, street_suffix, unit_number, bedrooms_total, bathrooms_total, living_area, photos, public_remarks, modification_timestamp")
    .eq("listing_key", listingKey)
    .maybeSingle();
  if (!data) return null;

  const address = data.unparsed_address || [data.unit_number ? `#${data.unit_number}` : null, data.street_number, data.street_name, data.street_suffix].filter(Boolean).join(" ") || data.city;
  const propertyType = data.property_sub_type || data.property_type || "home";
  const price = formatCad(data.listing_price);
  const specs = [
    data.bedrooms_total != null ? `${data.bedrooms_total} bed` : null,
    data.bathrooms_total != null ? `${data.bathrooms_total} bath` : null,
    data.living_area ? `${Number(data.living_area).toLocaleString()} sqft` : null,
    price,
  ].filter(Boolean).join(" · ");

  return {
    title: `${address} — ${data.city} ${propertyType} | Presale Properties`,
    description: stripMarkdown(data.public_remarks).slice(0, 200) || `${specs}${data.neighborhood || data.city ? ` in ${data.neighborhood || data.city}` : ""}.`,
    image: firstImage(data.photos) || DEFAULT_IMAGE,
    url: fullUrl,
    type: "website",
    updatedAt: data.modification_timestamp,
  };
}

async function resolveBlog(supabase: any, slug: string, fullUrl: string): Promise<Meta | null> {
  const { data } = await supabase
    .from("blog_posts")
    .select("title, excerpt, seo_title, seo_description, featured_image, updated_at")
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
    updatedAt: data.updated_at,
  };
}

async function resolveDeck(supabase: any, slug: string, fullUrl: string): Promise<Meta | null> {
  const { data } = await supabase
    .from("pitch_decks")
    .select("project_name, hero_image_url, updated_at")
    .eq("slug", slug)
    .maybeSingle();
  if (!data) return null;
  return {
    title: `${data.project_name} — VIP Pricing & Floor Plans | Presale Properties`,
    description: `Exclusive VIP package for ${data.project_name} — pricing, floor plans, deposit structure, and developer incentives.`,
    image: data.hero_image_url || DEFAULT_IMAGE,
    url: fullUrl,
    type: "website",
    updatedAt: data.updated_at,
  };
}

async function resolveDeveloper(supabase: any, slug: string, fullUrl: string): Promise<Meta | null> {
  const { data } = await supabase
    .from("developers")
    .select("name, description, logo_url, city, updated_at")
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
    updatedAt: data.updated_at,
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

// Build a stable, short ETag from updatedAt + path + image
async function buildEtag(meta: Meta, path: string): Promise<string> {
  const basis = `${path}|${meta.updatedAt ?? ""}|${meta.image ?? ""}|${meta.title ?? ""}`;
  const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(basis));
  const hex = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `W/"${hex.slice(0, 16)}"`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    // Caller passes the original page path as ?path=/projects/foo
    const path = url.searchParams.get("path") || "/";
    // Cache-busting: ?fresh=1 (or ?nocache=1) forces a no-cache response so admins can
    // re-share immediately after editing. ?v=<timestamp> changes the URL identity itself
    // (which is what social platforms key their cache off of), so it bypasses any
    // upstream CDN/scraper cache without us doing anything else.
    const fresh = url.searchParams.get("fresh") === "1" || url.searchParams.get("nocache") === "1";
    const targetUrl = `${SITE_ORIGIN}${path}`;
    const ua = req.headers.get("user-agent");

    // Humans → straight to the SPA. No DB hit, no work.
    if (!isCrawler(ua)) {
      return Response.redirect(targetUrl, 302);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? supabaseKey,
    );

    const pathname = new URL(targetUrl).pathname.replace(/\/+$/, "") || "/";
    const segments = pathname.split("/").filter(Boolean);

    // ─── Unfurl tracking (fire-and-forget) ──────────────────────
    // Logs every crawler hit so admins can see which links are being
    // shared and unfurled, and on which platforms. Skip the admin
    // verifier (it sets `x-test-crawler: 1`) so test runs don't pollute
    // analytics. Never await — must not block the OG response.
    const isTestCrawler = req.headers.get("x-test-crawler") === "1";
    if (!isTestCrawler) {
      const RESOURCE_MAP: Record<string, string> = {
        "presale-projects": "project",
        projects: "project",
        properties: "listing",
        assignments: "assignment",
        listings: "listing",
        resale: "listing",
        blog: "blog_post",
        deck: "pitch_deck",
        developers: "developer",
      };
      const resource_type = segments[0]
        ? RESOURCE_MAP[segments[0]] ?? segments[0]
        : "home";
      const resource_slug = segments[1] ?? null;
      const platform = detectPlatform(ua);
      // Don't await — fire and forget so a slow insert never delays the unfurl.
      supabase
        .from("share_events")
        .insert({
          event_type: "unfurl",
          path,
          resource_type,
          resource_slug,
          platform,
          user_agent: ua,
          referrer: req.headers.get("referer"),
        })
        .then(({ error }) => {
          if (error) console.error("share_events insert failed:", error.message);
        });
    }

    let meta: Meta | null = null;

    // Pattern matching, most specific first
    if (segments[0] === "presale-projects" && segments[1]) {
      meta = await resolveProject(supabase, segments[1], targetUrl);
    } else if (segments[0] === "projects" && segments[1]) {
      meta = await resolveProject(supabase, segments[1], targetUrl);
    } else if (segments[0] === "assignments" && segments[1]) {
      meta = await resolveListing(supabase, segments[1], targetUrl);
    } else if (segments[0] === "properties" && segments[1]) {
      meta = await resolveResale(supabaseAdmin, segments[1], targetUrl);
    } else if (segments[0] === "listings" && segments[1]) {
      meta = await resolveListing(supabase, segments[1], targetUrl);
    } else if (segments[0] === "resale" && segments[1]) {
      meta = await resolveResale(supabaseAdmin, segments[1], targetUrl);
    } else if (segments[0] === "blog" && segments[1] && segments[1] !== "category") {
      meta = await resolveBlog(supabase, segments[1], targetUrl);
    } else if (segments[0] === "deck" && segments[1]) {
      meta = await resolveDeck(supabase, segments[1], targetUrl);
    } else if (segments[0] === "developers" && segments[1]) {
      meta = await resolveDeveloper(supabase, segments[1], targetUrl);
    }

    if (!meta) meta = await resolveProjectFromSeoPath(supabase, pathname, targetUrl);

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

    // ETag: lets crawlers/CDNs revalidate cheaply. When the underlying resource changes
    // (updated_at moves), the ETag changes, and the next fetch returns fresh HTML.
    const etag = await buildEtag(meta, path);
    const lastModified = meta.updatedAt ? new Date(meta.updatedAt).toUTCString() : undefined;
    const ifNoneMatch = req.headers.get("if-none-match");

    // Cache strategy:
    //   - fresh=1            → no-store (admin "republish" flow)
    //   - dynamic resources  → 60s fresh, 5min SWR (updates surface fast)
    //   - static/default     → 5min fresh, 1h SWR (homepage etc. rarely changes)
    const isDynamic = !!meta.updatedAt;
    const cacheControl = fresh
      ? "no-store, must-revalidate"
      : isDynamic
        ? "public, max-age=60, s-maxage=60, stale-while-revalidate=300"
        : "public, max-age=300, s-maxage=600, stale-while-revalidate=3600";

    // 304 Not Modified — Facebook/LinkedIn/etc. honor this and keep showing
    // the (now still-correct) cached preview without us re-rendering.
    if (!fresh && ifNoneMatch && ifNoneMatch === etag) {
      return new Response(null, {
        status: 304,
        headers: {
          ...corsHeaders,
          ETag: etag,
          "Cache-Control": cacheControl,
          ...(lastModified ? { "Last-Modified": lastModified } : {}),
        },
      });
    }

    const responseHeaders = new Headers(corsHeaders);
    responseHeaders.set("Content-Type", "text/html; charset=utf-8");
    responseHeaders.set("Cache-Control", cacheControl);
    responseHeaders.set("ETag", etag);
    responseHeaders.set("Vary", "User-Agent");
    if (lastModified) responseHeaders.set("Last-Modified", lastModified);

    return new Response(renderHtml(meta), {
      status: 200,
      headers: responseHeaders,
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
    const fallbackHeaders = new Headers(corsHeaders);
    fallbackHeaders.set("Content-Type", "text/html; charset=utf-8");
    fallbackHeaders.set("Cache-Control", "no-store");

    return new Response(fallback, {
      status: 200,
      headers: fallbackHeaders,
    });
  }
});
