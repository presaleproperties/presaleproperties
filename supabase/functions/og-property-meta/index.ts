import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SITE_URL = "https://presaleproperties.com";

const ensureHttps = (url: string) => {
  if (!url) return url;
  return url.startsWith("http://") ? url.replace("http://", "https://") : url;
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const listingKey = url.searchParams.get("listingKey");

    if (!listingKey) {
      return new Response("Missing listingKey parameter", { status: 400, headers: corsHeaders });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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
    const description = `${isNewConstruction ? 'Brand new ' : ''}${listing.bedrooms_total || 0} bed, ${listing.bathrooms_total || 0} bath ${propertyType.toLowerCase()} for sale in ${listing.neighborhood || listing.city}, BC. ${isNewConstruction ? `Built ${listing.year_built}. ` : ''}${formatPrice(listing.listing_price)}.${listing.living_area ? ` ${listing.living_area} sqft.` : ''}`;

    // Build SEO-friendly address slug for canonical URL (REW-style: address-city-bc-listingKey)
    const slugify = (text: string) => text.toLowerCase()
      .replace(/['']/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-+/g, '-');
    
    const addressSlug = slugify(`${address} ${listing.city} bc`);
    const canonicalUrl = `${SITE_URL}/properties/${addressSlug}-${listingKey}`;

    // Generate HTML with OG meta tags
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