// Crawler-only renderer: returns a minimal static HTML page with route-specific
// Open Graph / Twitter / canonical meta tags baked into the <head>.
//
// Usage:  GET /functions/v1/og-snapshot?path=/<route>
//   &force=1  — bypass UA check (for testing)
//
// Bot UAs get the snapshot. Real browsers get a 302 to the SPA.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://presaleproperties.com";
const SITE_NAME = "PresaleProperties.com";
const DEFAULT_OG_IMAGE = "https://presaleproperties.com/og-image.png";
const DEFAULT_LOCALE = "en_CA";

const BOT_UA_REGEX =
  /(facebookexternalhit|facebookcatalog|Facebot|Twitterbot|LinkedInBot|Slackbot|Slack-ImgProxy|WhatsApp|TelegramBot|Discordbot|Pinterest|redditbot|SkypeUriPreview|Applebot|iMessageBot|Embedly|Quora\sLink\sPreview|googlebot|bingbot|baiduspider|yandexbot|duckduckbot|vkShare|outbrain|W3C_Validator|Googlebot|AhrefsBot|SemrushBot|MJ12bot|DotBot|Sogou|PetalBot|YandexBot|ia_archiver|prerender|HeadlessChrome)/i;

interface RouteMeta {
  title: string;
  description: string;
  url: string;
  image: string;
  type: string;
}

const esc = (s: string) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const clamp = (s: string, n: number) =>
  !s ? "" : s.length > n ? s.substring(0, n - 1).trimEnd() + "…" : s;

function toAbs(input: string | undefined | null, fallback: string): string {
  if (!input) return fallback;
  const t = String(input).trim();
  if (!t) return fallback;
  if (/^https?:\/\//i.test(t)) return t.replace(/^http:\/\//i, "https://");
  if (t.startsWith("//")) return `https:${t}`;
  if (t.startsWith("/")) return `${SITE_URL}${t}`;
  return `${SITE_URL}/${t}`;
}

function renderHtml(m: RouteMeta): string {
  const t = esc(clamp(m.title, 60));
  const d = esc(clamp(m.description, 160));
  const u = esc(m.url);
  const img = esc(m.image);
  const type = esc(m.type);
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
<meta property="og:site_name" content="${esc(SITE_NAME)}" />
<meta property="og:locale" content="${esc(DEFAULT_LOCALE)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${t}" />
<meta name="twitter:description" content="${d}" />
<meta name="twitter:url" content="${u}" />
<meta name="twitter:image" content="${img}" />
<link rel="alternate" href="${u}" />
<meta http-equiv="refresh" content="0;url=${u}" />
</head>
<body>
<h1>${t}</h1>
<p>${d}</p>
<p><a href="${u}">Continue to ${esc(SITE_NAME)}</a></p>
</body>
</html>`;
}

function staticRouteMeta(path: string): RouteMeta | null {
  const map: Record<string, Omit<RouteMeta, "url" | "image" | "type">> = {
    "/": {
      title: "Presale Condos BC | VIP Pricing & Floor Plans",
      description: "Get exclusive VIP pricing on 50+ presale condos and townhomes in Surrey, Langley and Abbotsford. Buyer-only representation. 400+ families helped.",
    },
    "/presale-projects": {
      title: "All Presale Projects in BC | New Developments",
      description: "Explore 50+ active presale projects across Metro Vancouver and the Fraser Valley. Floor plans, deposits, and VIP pricing in one place.",
    },
    "/calculator": {
      title: "Mortgage & Investment Calculator | Presale BC",
      description: "Calculate how much presale property you can afford in BC. Free calculator covers down payment, deposits, and closing costs.",
    },
    "/mortgage-calculator": {
      title: "Mortgage Calculator | Presale Properties",
      description: "Calculate how much presale property you can afford in Vancouver. Free calculator includes down payment, deposits, closing costs.",
    },
    "/about": {
      title: "About Presale Properties Group | New Construction Experts",
      description: "Meet Uzair Muhammad and The Presale Properties Group — Surrey-based presale specialists. 400+ buyers helped across Metro Vancouver since 2020.",
    },
    "/faq": {
      title: "Presale Condo FAQ BC | Common Questions Answered",
      description: "Get answers to the most common presale condo questions in BC. Deposits, timelines, assignments, buyer protections, and more.",
    },
    "/blog": {
      title: "Presale Condo Blog | Guides & Market Updates",
      description: "Expert guides on buying presale condos in BC. Market updates, deposit tips, neighbourhood guides, and investment strategies.",
    },
    "/assignments": {
      title: "Assignment Sales in Metro Vancouver",
      description: "Browse presale assignment sales in Metro Vancouver & Fraser Valley. Buying, selling, FAQ, and live inventory — all in one place.",
    },
    "/map-search": {
      title: "Map Search | Find New Homes in Metro Vancouver",
      description: "Search presale condos and move-in ready new homes on an interactive map. Find all new construction in Metro Vancouver.",
    },
    "/login": {
      title: "Login | Presale Properties Portal",
      description: "Sign in or create an account to access the Presale Properties agent and developer portals.",
    },
  };
  const hit = map[path];
  if (!hit) return null;
  return { ...hit, url: `${SITE_URL}${path === "/" ? "/" : path}`, image: DEFAULT_OG_IMAGE, type: "website" };
}

/**
 * Generate slug candidates from a URL path.
 * SEO URLs look like: /<neighborhood>-presale-<type>-<actual-slug>
 * but the DB slug is often just the trailing portion (e.g. "bromley").
 * We try multiple progressively-shorter candidates.
 */
function slugCandidates(path: string): string[] {
  const clean = path.replace(/^\/+/, "").replace(/\/+$/, "").split("?")[0].toLowerCase();
  if (!clean) return [];
  const out = new Set<string>();

  // /presale/<slug>
  if (clean.startsWith("presale/")) {
    const s = clean.substring("presale/".length);
    if (s) out.add(s);
  }

  // Single segment — use as-is and progressively strip "<x>-presale-<type>-" prefix
  const seg = clean.includes("/") ? clean.split("/").pop()! : clean;
  out.add(seg);

  // Pattern: <neighborhood>-presale-<type>-<rest>
  const m = seg.match(/^(.+?)-presale-(condos|townhomes|homes|duplexes|condo|townhome)-(.+)$/);
  if (m) {
    out.add(m[3]); // trailing actual slug, e.g. "bromley"
    // Also try last hyphen-segment of m[3] in case there's still a city suffix
    const lastDash = m[3].lastIndexOf("-");
    if (lastDash > 0) out.add(m[3].substring(lastDash + 1));
  }

  // Pattern: <neighborhood>-presale-<rest> (no type)
  const m2 = seg.match(/^(.+?)-presale-(.+)$/);
  if (m2) out.add(m2[2]);

  return Array.from(out).filter(Boolean);
}

async function projectMeta(
  supabase: ReturnType<typeof createClient>,
  candidates: string[],
  fullUrl: string,
): Promise<RouteMeta | null> {
  if (candidates.length === 0) return null;

  console.log("[og-snapshot] trying slug candidates:", candidates);

  // Try exact match across all candidates in one query
  const { data, error } = await supabase
    .from("presale_projects")
    .select("name, city, short_description, full_description, seo_title, seo_description, featured_image, og_image, gallery_images, slug")
    .in("slug", candidates)
    .eq("is_published", true)
    .limit(1);

  if (error) {
    console.error("[og-snapshot] supabase query error:", error.message);
    return null;
  }

  console.log("[og-snapshot] supabase returned rows:", data?.length ?? 0);

  if (!data || data.length === 0) return null;

  const row: any = data[0];
  console.log("[og-snapshot] matched slug:", row.slug);

  const heroRaw =
    row.og_image ||
    row.featured_image ||
    (Array.isArray(row.gallery_images) && row.gallery_images[0]) ||
    "";
  const image = toAbs(heroRaw, DEFAULT_OG_IMAGE);

  const title = row.seo_title || `${row.name} | ${row.city} | Floor Plans & Pricing`;
  const description =
    (row.seo_description || row.short_description || row.full_description || "").trim() ||
    `Explore floor plans, pricing, deposit structure, and incentives for ${row.name} in ${row.city}.`;

  return { title, description, url: fullUrl, image, type: "website" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const reqUrl = new URL(req.url);
    const targetPath = reqUrl.searchParams.get("path") || "/";
    const ua = req.headers.get("user-agent") || "";
    const force = reqUrl.searchParams.get("force") === "1";
    const isBot = force || BOT_UA_REGEX.test(ua);

    console.log("[og-snapshot] request", { path: targetPath, ua: ua.slice(0, 80), isBot, force });

    const canonical = `${SITE_URL}${targetPath.startsWith("/") ? targetPath : "/" + targetPath}`.split("?")[0];

    if (!isBot) {
      return new Response(null, { status: 302, headers: { ...corsHeaders, Location: canonical } });
    }

    // Anon key is fine — RLS allows public SELECT where is_published=true.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );

    // 1. Static route map
    let meta: RouteMeta | null = staticRouteMeta(targetPath);
    if (meta) console.log("[og-snapshot] matched static route:", targetPath);

    // 2. Project lookup with multiple slug candidates
    if (!meta) {
      const candidates = slugCandidates(targetPath);
      meta = await projectMeta(supabase, candidates, canonical);
    }

    // 3. Generic fallback (NOT homepage)
    if (!meta) {
      console.log("[og-snapshot] no match — using generic fallback");
      meta = {
        title: "PresaleProperties.com | Presale Condos in BC",
        description: "Browse presale and assignment condo opportunities across Metro Vancouver and the Fraser Valley.",
        url: canonical,
        image: DEFAULT_OG_IMAGE,
        type: "website",
      };
    }

    console.log("[og-snapshot] final meta", { title: meta.title, image: meta.image });

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
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
