import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://presaleproperties.com";
const DEFAULT_OG = {
  title:
    "Presale Condos BC | VIP Pricing & Floor Plans | The Presale Properties Group",
  description:
    "Browse 100+ presale condos & townhomes in Metro Vancouver. VIP pricing, floor plans & early access for new construction in Vancouver, Surrey, Langley, Coquitlam.",
  image: `${SITE_URL}/og-image.png`,
};

// Bot user-agent patterns (social crawlers that don't execute JS)
const BOT_PATTERNS = [
  "facebookexternalhit",
  "Facebot",
  "Twitterbot",
  "LinkedInBot",
  "WhatsApp",
  "Slackbot",
  "Discordbot",
  "TelegramBot",
  "Pinterest",
  "Googlebot",
  "bingbot",
  "Applebot",
  "iMessage",
  "vkShare",
  "W3C_Validator",
  "Embedly",
  "Quora Link Preview",
  "Showyoubot",
  "outbrain",
  "redditbot",
  "Tumblr",
  "Snap URL Preview Service",
  "chatgpt-user",
  "GPTBot",
  "ClaudeBot",
  "PerplexityBot",
  "Bytespider",
];

function isBot(ua: string): boolean {
  const lower = ua.toLowerCase();
  return BOT_PATTERNS.some((p) => lower.includes(p.toLowerCase()));
}

// URL parsing helpers (mirrors src/lib/seoUrls.ts logic)
function parsePresaleUrl(
  path: string
): { slug: string; type: string; neighborhood: string } | null {
  const match = path.match(
    /^\/(.+)-presale-(condos|townhomes|homes|duplexes)-(.+)$/
  );
  if (!match) return null;
  return { neighborhood: match[1], type: match[2], slug: match[3] };
}

function parseBlogUrl(path: string): string | null {
  const match = path.match(/^\/blog\/(.+)$/);
  return match ? match[1] : null;
}

function parseLegacyProjectUrl(path: string): string | null {
  const match = path.match(/^\/presale-projects\/(.+)$/);
  return match ? match[1] : null;
}

function formatPrice(price: number | null): string {
  if (!price) return "";
  if (price >= 1_000_000) {
    return `$${(price / 1_000_000).toFixed(1)}M`;
  }
  return `$${price.toLocaleString("en-CA")}`;
}

function buildHtml(meta: {
  title: string;
  description: string;
  image: string;
  url: string;
  type?: string;
}): string {
  const esc = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  return `<!DOCTYPE html>
<html lang="en-CA">
<head>
<meta charset="utf-8"/>
<title>${esc(meta.title)}</title>
<meta name="description" content="${esc(meta.description)}"/>
<link rel="canonical" href="${esc(meta.url)}"/>

<!-- Open Graph -->
<meta property="og:type" content="${meta.type || "website"}"/>
<meta property="og:title" content="${esc(meta.title)}"/>
<meta property="og:description" content="${esc(meta.description)}"/>
<meta property="og:image" content="${esc(meta.image)}"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta property="og:url" content="${esc(meta.url)}"/>
<meta property="og:site_name" content="PresaleProperties.com"/>
<meta property="og:locale" content="en_CA"/>

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${esc(meta.title)}"/>
<meta name="twitter:description" content="${esc(meta.description)}"/>
<meta name="twitter:image" content="${esc(meta.image)}"/>

</head>
<body>
<p>Redirecting…</p>
<script>window.location.replace("${esc(meta.url)}");</script>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.searchParams.get("path") || "/";
    const ua = req.headers.get("user-agent") || "";

    // Only serve OG HTML for bots; redirect humans to the real site
    if (!isBot(ua)) {
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, Location: `${SITE_URL}${path}` },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let meta = { ...DEFAULT_OG, url: `${SITE_URL}${path}` };

    // 1) Presale project pages (SEO URL format)
    const presaleParsed = parsePresaleUrl(path);
    const legacySlug = parseLegacyProjectUrl(path);
    const projectSlug = presaleParsed?.slug || legacySlug;

    if (projectSlug) {
      const { data: project } = await supabase
        .from("presale_projects")
        .select(
          "name, city, neighborhood, starting_price, featured_image, project_type, seo_description, status"
        )
        .eq("slug", projectSlug)
        .eq("is_published", true)
        .maybeSingle();

      if (project) {
        const priceStr = formatPrice(project.starting_price);
        meta.title = priceStr
          ? `${project.name} | From ${priceStr} | Presale ${project.city}`
          : `${project.name} | Presale ${project.project_type === "townhome" ? "Townhomes" : "Condos"} in ${project.city}`;
        meta.description =
          project.seo_description ||
          `Discover ${project.name} in ${project.neighborhood || project.city}. ${priceStr ? `Starting from ${priceStr}. ` : ""}VIP pricing, floor plans & early access.`;
        if (project.featured_image) meta.image = project.featured_image;
      }
    }

    // 2) Blog post pages
    const blogSlug = parseBlogUrl(path);
    if (blogSlug) {
      const { data: post } = await supabase
        .from("blog_posts")
        .select(
          "title, excerpt, seo_title, seo_description, featured_image"
        )
        .eq("slug", blogSlug)
        .eq("is_published", true)
        .maybeSingle();

      if (post) {
        meta.title =
          post.seo_title || `${post.title} | Presale Properties Blog`;
        meta.description =
          post.seo_description ||
          post.excerpt ||
          DEFAULT_OG.description;
        if (post.featured_image) meta.image = post.featured_image;
        meta.type = "article";
      }
    }

    // 3) City pages (e.g., /surrey-presale-condos, /langley-presale-townhomes)
    const cityMatch = path.match(
      /^\/([\w-]+)-presale-(condos|townhomes)$/
    );
    if (cityMatch && !presaleParsed) {
      const cityName = cityMatch[1]
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      const typeLabel = cityMatch[2] === "condos" ? "Condos" : "Townhomes";
      meta.title = `${cityName} Presale ${typeLabel} 2026 | VIP Pricing | Presale Properties`;
      meta.description = `Browse presale ${typeLabel.toLowerCase()} in ${cityName}, BC. Get VIP pricing, floor plans, deposit structures & early access to new construction projects.`;
    }

    const html = buildHtml(meta);

    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch (err) {
    console.error("og-prerender error:", err);
    const html = buildHtml({
      ...DEFAULT_OG,
      url: SITE_URL,
    });
    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  }
});
