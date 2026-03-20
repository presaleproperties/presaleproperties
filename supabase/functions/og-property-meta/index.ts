import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://presaleproperties.com",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};




// ── Rate Limiting ─────────────────────────────────────────────────────────────
const RL_WINDOW = 3600; // seconds
const RL_MAX = 100;

async function rateLimited(req: Request, funcKey: string): Promise<boolean> {
  try {
    const ip = (req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "anon").split(",")[0].trim();
    const key = `${funcKey}:${ip}`;
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const since = new Date(Date.now() - RL_WINDOW * 1000).toISOString();
    const { count, error } = await sb.from("rate_limit_log")
      .select("id", { count: "exact", head: true })
      .eq("rate_key", key).gte("created_at", since);
    if (error) return false;
    if ((count ?? 0) >= RL_MAX) return true;
    await sb.from("rate_limit_log").insert({ rate_key: key });
    return false;
  } catch { return false; }
}
// ─────────────────────────────────────────────────────────────────────────────



const SITE_URL = "https://presaleproperties.com";

const ensureHttps = (url: string) => {
  if (!url) return url;
  return url.startsWith("http://") ? url.replace("http://", "https://") : url;
};

// Bot/crawler user agents that need OG meta tags
const BOT_UA_PATTERNS = [
  'facebookexternalhit', 'Facebot', 'Twitterbot', 'WhatsApp', 'LinkedInBot',
  'Slackbot', 'TelegramBot', 'Discordbot', 'Googlebot', 'bingbot',
  'iMessageBot', 'Applebot', 'Pinterest', 'Embedly', 'Quora Link Preview',
  'Showyoubot', 'outbrain', 'vkShare', 'W3C_Validator', 'redditbot',
  'Pinterestbot', 'MicroMessenger', 'SkypeUriPreview',
];

const isBot = (userAgent: string): boolean => {
  const ua = userAgent.toLowerCase();
  return BOT_UA_PATTERNS.some(bot => ua.includes(bot.toLowerCase()));
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Rate limit check
  if (await rateLimited(req, "og-property-meta")) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "3600" }
    });
  }

  try {
    const url = new URL(req.url);
    const listingKey = url.searchParams.get("listingKey");
    const projectSlug = url.searchParams.get("projectSlug");
    const deckSlug = url.searchParams.get("deckSlug");

    if (!listingKey && !projectSlug && !deckSlug) {
      return new Response("Missing listingKey, projectSlug, or deckSlug parameter", { status: 400, headers: corsHeaders });
    }

    // ── Pitch Deck sharing ────────────────────────────────────────────────────
    if (deckSlug) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: deck, error } = await supabase
        .from("pitch_decks")
        .select("project_name, tagline, city, neighborhood, hero_image_url, slug, description, floor_plans")
        .eq("slug", deckSlug)
        .maybeSingle();

      if (error || !deck) {
        return new Response("Deck not found", { status: 404, headers: corsHeaders });
      }

      const userAgent = req.headers.get("user-agent") || "";
      const canonicalUrl = `${SITE_URL}/deck/${deck.slug}`;
      const heroImage = ensureHttps(deck.hero_image_url) || `${SITE_URL}/og-image.png`;

      // Extract starting price from first floor plan with a price
      let startingPrice: string | null = null;
      try {
        const plans = Array.isArray(deck.floor_plans) ? deck.floor_plans : [];
        const firstPriced = plans.find((p: any) => p?.price_from && p.price_from.trim());
        if (firstPriced?.price_from) {
          const num = parseFloat(firstPriced.price_from.replace(/[^0-9.]/g, ""));
          if (!isNaN(num) && num > 0) {
            startingPrice = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(num);
          }
        }
      } catch (_) { /* ignore */ }

      const locationLabel = deck.neighborhood && deck.city
        ? `${deck.neighborhood}, ${deck.city}`
        : deck.neighborhood || deck.city || "BC";

      const title = startingPrice
        ? `${deck.project_name} — From ${startingPrice} | ${locationLabel}`
        : `${deck.project_name} — Exclusive Presale | ${locationLabel}`;

      const rawDesc = (deck.description || deck.tagline || `Exclusive presale opportunity${deck.city ? ` in ${deck.city}` : ""}.`).replace(/[#*_`>]/g, "").trim();
      const descBase = rawDesc.length > 120 ? rawDesc.slice(0, 117) + "…" : rawDesc;
      const description = startingPrice
        ? `Starting from ${startingPrice}. ${descBase}`
        : descBase;
      const metaDesc = description.length > 160 ? description.slice(0, 157) + "…" : description;

      if (!isBot(userAgent)) {
        return new Response(null, { status: 302, headers: { ...corsHeaders, "Location": canonicalUrl } });
      }

      const html = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title><meta name="description" content="${metaDesc}">
<meta property="og:type" content="website">
<meta property="og:url" content="${canonicalUrl}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${metaDesc}">
<meta property="og:image" content="${heroImage}">
<meta property="og:image:secure_url" content="${heroImage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:site_name" content="PresaleProperties.com">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${metaDesc}">
<meta name="twitter:image" content="${heroImage}">
<link rel="canonical" href="${canonicalUrl}">
</head><body>
<img src="${heroImage}" alt="${deck.project_name}" style="max-width:100%;border-radius:8px;">
<h1>${title}</h1><p>${metaDesc}</p>
<a href="${canonicalUrl}" style="display:inline-block;margin-top:1rem;padding:12px 24px;background:#b8860b;color:white;text-decoration:none;border-radius:6px;">View Investment Deck</a>
</body></html>`;

      const responseHeaders = new Headers();
      responseHeaders.set("Content-Type", "text/html; charset=utf-8");
      responseHeaders.set("Cache-Control", "public, max-age=3600, s-maxage=86400");
      responseHeaders.set("Access-Control-Allow-Origin", "*");
      return new Response(html, { status: 200, headers: responseHeaders });
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Check user agent - redirect humans to the canonical page, serve OG HTML to bots
    const userAgent = req.headers.get("user-agent") || "";

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle presale project sharing
    if (projectSlug) {
      const { data: project, error } = await supabase
        .from("presale_projects")
        .select("*")
        .eq("slug", projectSlug)
        .maybeSingle();

      if (error || !project) {
        return new Response("Project not found", { status: 404, headers: corsHeaders });
      }

      const slugify = (text: string) => text.toLowerCase()
        .replace(/['']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-+/g, '-');

      const neighborhood = project.neighborhood || project.city || "vancouver";
      const typeMap: Record<string, string> = { condo: "condos", townhome: "townhomes", mixed: "homes", duplex: "duplexes", single_family: "homes" };
      const typeSlug = typeMap[project.project_type] || "homes";
      const canonicalUrl = `${SITE_URL}/${slugify(neighborhood)}-presale-${typeSlug}-${project.slug}`;
      
      const heroImage = ensureHttps(project.featured_image) || `${SITE_URL}/og-image.png`;
      const title = `${project.name} — ${project.city} Presale`;
      const description = `${project.project_type === "condo" ? "Condo" : project.project_type === "townhome" ? "Townhome" : "Home"} project in ${project.neighborhood || project.city}. Starting from ${project.starting_price ? new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(project.starting_price) : "TBD"}.`;

      if (!isBot(userAgent)) {
        return new Response(null, { status: 302, headers: { ...corsHeaders, "Location": canonicalUrl } });
      }

      const html = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title><meta name="description" content="${description}">
<meta property="og:type" content="website"><meta property="og:url" content="${canonicalUrl}">
<meta property="og:title" content="${title}"><meta property="og:description" content="${description}">
<meta property="og:image" content="${heroImage}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:site_name" content="PresaleProperties.com">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}"><meta name="twitter:image" content="${heroImage}">
<link rel="canonical" href="${canonicalUrl}">
</head><body><h1>${title}</h1><p>${description}</p><a href="${canonicalUrl}">View Project</a></body></html>`;

      const responseHeaders = new Headers();
      responseHeaders.set("Content-Type", "text/html; charset=utf-8");
      responseHeaders.set("Cache-Control", "public, max-age=3600, s-maxage=86400");
      responseHeaders.set("Access-Control-Allow-Origin", "*");
      return new Response(html, { status: 200, headers: responseHeaders });
    }

    // Fetch the listing
    const { data: listing, error } = await supabase
      .from("mls_listings")
      .select("*")
      .eq("listing_key", listingKey)
      .maybeSingle();

    if (error || !listing) {
      console.error("Error fetching listing:", error);
      return new Response("Listing not found", { status: 404, headers: corsHeaders });
    }

    // Build address
    const getAddress = () => {
      if (listing.unparsed_address) return listing.unparsed_address;
      const parts = [];
      if (listing.unit_number) parts.push(`#${listing.unit_number}`);
      if (listing.street_number) parts.push(listing.street_number);
      if (listing.street_name) parts.push(listing.street_name);
      if (listing.street_suffix) parts.push(listing.street_suffix);
      return parts.length > 0 ? parts.join(" ") : listing.city;
    };

    const address = getAddress();

    // Format price
    const formatPrice = (price: number) => {
      return new Intl.NumberFormat("en-CA", {
        style: "currency",
        currency: "CAD",
        maximumFractionDigits: 0,
      }).format(price);
    };

    // Get property type label
    const getPropertyTypeLabel = () => {
      const subType = listing.property_sub_type?.toLowerCase() || "";
      const propType = listing.property_type?.toLowerCase() || "";
      
      if (subType.includes("condo") || subType.includes("apartment") || propType.includes("condo")) {
        return "Condo";
      }
      if (subType.includes("townhouse") || subType.includes("townhome") || propType.includes("town")) {
        return "Townhome";
      }
      if (subType.includes("single") || subType.includes("house") || subType.includes("detached")) {
        return "Detached Home";
      }
      if (subType.includes("duplex")) {
        return "Duplex";
      }
      return "Home";
    };

    const propertyType = getPropertyTypeLabel();
    const isNewConstruction = listing.year_built !== null && listing.year_built >= 2024;

    // Get the first photo - ensure it's a valid, public image URL
    let heroImage = `${SITE_URL}/og-image.png`;
    if (listing.photos && Array.isArray(listing.photos) && listing.photos.length > 0) {
      const firstPhoto = listing.photos[0];
      const photoUrl = firstPhoto?.MediaURL || firstPhoto?.url || (typeof firstPhoto === "string" ? firstPhoto : null);
      if (photoUrl) {
        heroImage = ensureHttps(photoUrl);
      }
    }

    // Build title and description
    const title = `For Sale: ${address}, ${listing.city} BC`;
    const description = `${listing.bedrooms_total || 0} bed, ${listing.bathrooms_total || 0} bath ${propertyType.toLowerCase()} in ${listing.neighborhood || listing.city}. ${formatPrice(listing.listing_price)}.`;

    // Build SEO-friendly address slug for canonical URL (REW-style: address-city-bc-listingKey)
    const slugify = (text: string) => text.toLowerCase()
      .replace(/['']/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-+/g, '-');
    
    const addressSlug = slugify(`${address} ${listing.city} bc`);
    const canonicalUrl = `${SITE_URL}/properties/${addressSlug}-${listingKey}`;

    // If not a bot, redirect to the actual listing page
    if (!isBot(userAgent)) {
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, "Location": canonicalUrl },
      });
    }

    // Generate HTML with OG meta tags for bots/crawlers
    // NOTE: This is a complete HTML document that social crawlers can parse
    // The page includes a link to the actual listing for users who land here
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${heroImage}">
  <meta property="og:image:secure_url" content="${heroImage}">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="PresaleProperties.com">
  <meta property="og:locale" content="en_CA">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${canonicalUrl}">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${heroImage}">
  
  <link rel="canonical" href="${canonicalUrl}">
  
  <style>
    body { font-family: system-ui, sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; }
    img { max-width: 100%; border-radius: 8px; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    .price { font-size: 1.25rem; color: #16a34a; font-weight: bold; }
    .cta { display: inline-block; margin-top: 1rem; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; }
  </style>
</head>
<body>
  <img src="${heroImage}" alt="${address}">
  <h1>${title}</h1>
  <p class="price">${formatPrice(listing.listing_price)}</p>
  <p>${description}</p>
  <a href="${canonicalUrl}" class="cta">View Full Listing</a>
</body>
</html>`;

    // Return response with explicit HTML content type
    // Note: Headers must be set as a new Headers object to ensure proper content type
    const responseHeaders = new Headers();
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Headers", "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version");
    responseHeaders.set("Content-Type", "text/html; charset=utf-8");
    responseHeaders.set("Cache-Control", "public, max-age=3600, s-maxage=86400");
    
    return new Response(html, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error("Error in og-property-meta:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});