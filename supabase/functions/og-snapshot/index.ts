// Crawler-only renderer: returns a minimal static HTML page with route-specific
// Open Graph / Twitter / canonical meta tags baked into the <head>.
//
// Usage:
//   GET /functions/v1/og-snapshot?path=/<some-route>
//
// Bot user-agents (Facebook, WhatsApp, LinkedIn, Slack, Twitter, iMessage, etc.)
// receive the snapshot. Real browsers are 302-redirected to the SPA so they get
// the full app. Project routes pull live data from the public.presale_projects
// table so newly added projects work instantly with no rebuild.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://presaleproperties.com";
const SITE_NAME = "PresaleProperties.com";
const DEFAULT_OG_IMAGE = "https://presaleproperties.com/og-image.png";
const DEFAULT_LOCALE = "en_CA";

// Bot UA patterns that should receive the static snapshot.
// Real browsers fall through to the SPA via 302 redirect.
const BOT_UA_REGEX =
  /(facebookexternalhit|facebookcatalog|Facebot|Twitterbot|LinkedInBot|Slackbot|Slack-ImgProxy|WhatsApp|TelegramBot|Discordbot|Pinterest|redditbot|SkypeUriPreview|Applebot|iMessageBot|Embedly|Quora\sLink\sPreview|googlebot|bingbot|baiduspider|yandexbot|duckduckbot|vkShare|outbrain|W3C_Validator|Googlebot|AhrefsBot|SemrushBot|MJ12bot|DotBot|Sogou|PetalBot|YandexBot|ia_archiver|prerender|HeadlessChrome)/i;

interface RouteMeta {
  title: string;
  description: string;
  url: string;
  image: string;
  type: string;
}

function escapeHtml(input: string): string {
  return String(input ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function clamp(text: string, max: number): string {
  if (!text) return "";
  return text.length > max ? text.substring(0, max - 1).trimEnd() + "…" : text;
}

function toAbsoluteUrl(input: string | undefined | null, fallback: string): string {
  if (!input) return fallback;
  const trimmed = String(input).trim();
  if (!trimmed) return fallback;
  if (/^https?:\/\//i.test(trimmed)) return trimmed.replace(/^http:\/\//i, "https://");
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (trimmed.startsWith("/")) return `${SITE_URL}${trimmed}`;
  return `${SITE_URL}/${trimmed}`;
}

/** Render the static HTML snapshot for a given meta object. */
function renderHtml(meta: RouteMeta): string {
  const t = escapeHtml(clamp(meta.title, 60));
  const d = escapeHtml(clamp(meta.description, 160));
  const u = escapeHtml(meta.url);
  const img = escapeHtml(meta.image);
  const type = escapeHtml(meta.type);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${t}</title>
<meta name="description" content="${d}" />
<link rel="canonical" href="${u}" />

<meta property="og:title" content="${t}" />
<meta property="og:description" content="${d}" />
<meta property="og:url" content="${u}" />
<meta property="og:type" content="${type}" />
<meta property="og:image" content="${img}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />
<meta property="og:locale" content="${escapeHtml(DEFAULT_LOCALE)}" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${t}" />
<meta name="twitter:description" content="${d}" />
<meta name="twitter:url" content="${u}" />
<meta name="twitter:image" content="${img}" />

<!-- Crawlers see this snapshot. Real users land on the SPA below. -->
<link rel="alternate" href="${u}" />
<meta http-equiv="refresh" content="0;url=${u}" />
</head>
<body>
<h1>${t}</h1>
<p>${d}</p>
<p><a href="${u}">Continue to ${escapeHtml(SITE_NAME)}</a></p>
</body>
</html>`;
}

/** Static meta for non-project public routes. */
function staticRouteMeta(path: string): RouteMeta | null {
  const map: Record<string, Omit<RouteMeta, "url" | "image" | "type">> = {
    "/": {
      title: "Presale Condos BC | VIP Pricing & Floor Plans",
      description:
        "Get exclusive VIP pricing on 50+ presale condos and townhomes in Surrey, Langley and Abbotsford. Buyer-only representation. 400+ families helped.",
    },
    "/presale-projects": {
      title: "Browse Presale Condos in Metro Vancouver & BC",
      description:
        "Explore 50+ active presale projects across Metro Vancouver and the Fraser Valley. Floor plans, deposits, and VIP pricing in one place.",
    },
    "/calculator": {
      title: "Mortgage & Investment Calculator",
      description:
        "Calculate how much presale property you can afford in BC. Free calculator covers down payment, deposits, and closing costs.",
    },
    "/mortgage-calculator": {
      title: "Mortgage Calculator | Presale Properties",
      description:
        "Calculate how much presale property you can afford in Vancouver. Free calculator includes down payment, deposits, closing costs.",
    },
    "/about": {
      title: "About Presale Properties Group | New Construction Experts",
      description:
        "Meet Uzair Muhammad and The Presale Properties Group — Surrey-based presale specialists. 400+ buyers helped across Metro Vancouver since 2020.",
    },
    "/faq": {
      title: "Presale Condo FAQ BC | Common Questions Answered",
      description:
        "Get answers to the most common presale condo questions in BC. Deposits, timelines, assignments, buyer protections, and more.",
    },
    "/blog": {
      title: "Presale Condo Blog | Guides & Market Updates",
      description:
        "Expert guides on buying presale condos in BC. Market updates, deposit tips, neighbourhood guides, and investment strategies.",
    },
    "/assignments": {
      title: "Assignment Sales in Metro Vancouver",
      description:
        "Browse presale assignment sales in Metro Vancouver & Fraser Valley. Buying, selling, FAQ, and live inventory — all in one place.",
    },
    "/map-search": {
      title: "Map Search | Find New Homes in Metro Vancouver",
      description:
        "Search presale condos and move-in ready new homes on an interactive map. Find all new construction in Metro Vancouver.",
    },
    "/login": {
      title: "Login | Presale Properties Portal",
      description:
        "Sign in or create an account to access the Presale Properties agent and developer portals.",
    },
  };
  const hit = map[path];
  if (!hit) return null;
  return {
    ...hit,
    url: `${SITE_URL}${path === "/" ? "/" : path}`,
    image: DEFAULT_OG_IMAGE,
    type: "website",
  };
}

/**
 * Try to extract a project slug from a path.
 * Project URLs follow patterns like:
 *   /<city>-presale-<type>-<name>
 *   /<city>-presale-<name>
 *   /presale/<slug>
 *   /<slug> (fallback — last segment used as slug)
 */
function extractProjectSlug(path: string): string | null {
  if (!path || path === "/") return null;
  const clean = path.replace(/^\/+/, "").replace(/\/+$/, "").split("?")[0];
  if (!clean) return null;
  // Single-segment paths are candidate project slugs.
  if (!clean.includes("/")) return clean;
  // /presale/<slug>
  const parts = clean.split("/");
  if (parts[0] === "presale" && parts[1]) return parts[1];
  return null;
}

async function projectMeta(
  supabase: ReturnType<typeof createClient>,
  slug: string,
  fullUrl: string,
): Promise<RouteMeta | null> {
  const { data, error } = await supabase
    .from("presale_projects")
    .select("name, city, short_description, featured_image, gallery_images, slug")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error || !data) return null;

  const heroRaw =
    (data as any).featured_image ||
    ((data as any).gallery_images && (data as any).gallery_images[0]) ||
    "";
  const heroAbs = toAbsoluteUrl(heroRaw, DEFAULT_OG_IMAGE);

  const title = `${(data as any).name} | ${(data as any).city} | Floor Plans & Pricing`;
  const desc = ((data as any).short_description || "").trim() ||
    `Explore floor plans, pricing, deposit structure, and incentives for ${(data as any).name} in ${(data as any).city}.`;

  return {
    title,
    description: desc,
    url: fullUrl,
    image: heroAbs,
    type: "website",
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const reqUrl = new URL(req.url);
    const targetPath = reqUrl.searchParams.get("path") || "/";
    const ua = req.headers.get("user-agent") || "";
    const force = reqUrl.searchParams.get("force") === "1";
    const isBot = force || BOT_UA_REGEX.test(ua);

    // Build the absolute canonical URL for this path
    const canonical = `${SITE_URL}${targetPath.startsWith("/") ? targetPath : "/" + targetPath}`.split("?")[0];

    // Real users → 302 to the SPA
    if (!isBot) {
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, Location: canonical },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );

    // 1. Try static route map (homepage, /about, /faq, etc.)
    let meta: RouteMeta | null = staticRouteMeta(targetPath);

    // 2. Otherwise treat path as a project slug and look it up live
    if (!meta) {
      const slug = extractProjectSlug(targetPath);
      if (slug) {
        meta = await projectMeta(supabase, slug, canonical);
      }
    }

    // 3. Final fallback — generic site meta with the requested URL as canonical.
    //    Never return the homepage default, per spec.
    if (!meta) {
      meta = {
        title: "PresaleProperties.com | Presale Condos in BC",
        description:
          "Browse presale and assignment condo opportunities across Metro Vancouver and the Fraser Valley.",
        url: canonical,
        image: DEFAULT_OG_IMAGE,
        type: "website",
      };
    }

    const html = renderHtml(meta);
    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300, s-maxage=600",
        "X-Robots-Tag": "all",
      },
    });
  } catch (err) {
    console.error("[og-snapshot] error", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "unknown" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
