import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/xml",
};

const SITE_URL = "https://presaleproperties.com";

// URL-friendly slug helper
const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
};

// Get project type slug for SEO URLs
const getProjectTypeSlug = (type: string): string => {
  const typeMap: Record<string, string> = {
    condo: 'condos',
    townhome: 'townhomes',
    mixed: 'homes',
    duplex: 'duplexes',
    single_family: 'homes',
  };
  return typeMap[type] || 'homes';
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date().toISOString().split("T")[0];

    // Static pages - only include routes that exist in App.tsx
    const staticPages: { url: string; priority: string; changefreq: string; lastmod?: string }[] = [
      { url: "/", priority: "1.0", changefreq: "daily", lastmod: now },
      { url: "/presale-projects", priority: "0.9", changefreq: "daily", lastmod: now },
      { url: "/assignments", priority: "0.9", changefreq: "daily", lastmod: now },
      { url: "/resale", priority: "0.9", changefreq: "daily", lastmod: now },
      { url: "/map-search", priority: "0.85", changefreq: "daily", lastmod: now },
      { url: "/blog", priority: "0.8", changefreq: "weekly", lastmod: now },
      { url: "/guides", priority: "0.8", changefreq: "weekly", lastmod: now },
      { url: "/buyers-guide", priority: "0.85", changefreq: "monthly", lastmod: now },
      { url: "/presale-guide", priority: "0.85", changefreq: "monthly", lastmod: now },
      { url: "/roi-calculator", priority: "0.85", changefreq: "monthly", lastmod: now },
      { url: "/mortgage-calculator", priority: "0.8", changefreq: "monthly", lastmod: now },
      { url: "/investment-snapshot", priority: "0.8", changefreq: "monthly", lastmod: now },
      { url: "/about", priority: "0.6", changefreq: "monthly", lastmod: now },
      { url: "/contact", priority: "0.6", changefreq: "monthly", lastmod: now },
      { url: "/for-developers", priority: "0.7", changefreq: "monthly", lastmod: now },
      { url: "/vip", priority: "0.7", changefreq: "monthly", lastmod: now },
      // SEO Neighborhood Landing Pages - High value local content
      { url: "/burnaby-brentwood-presale", priority: "0.9", changefreq: "weekly", lastmod: now },
      { url: "/burnaby-metrotown-presale", priority: "0.9", changefreq: "weekly", lastmod: now },
      { url: "/surrey-cloverdale-presale", priority: "0.9", changefreq: "weekly", lastmod: now },
      { url: "/south-surrey-presale", priority: "0.9", changefreq: "weekly", lastmod: now },
      { url: "/langley-willoughby-presale", priority: "0.9", changefreq: "weekly", lastmod: now },
      { url: "/surrey-city-centre-presale", priority: "0.9", changefreq: "weekly", lastmod: now },
      { url: "/coquitlam-burquitlam-presale", priority: "0.9", changefreq: "weekly", lastmod: now },
      { url: "/vancouver-mount-pleasant-presale", priority: "0.9", changefreq: "weekly", lastmod: now },
      { url: "/richmond-brighouse-presale", priority: "0.9", changefreq: "weekly", lastmod: now },
      { url: "/north-vancouver-lonsdale-presale", priority: "0.9", changefreq: "weekly", lastmod: now },
      { url: "/new-westminster-downtown-presale", priority: "0.9", changefreq: "weekly", lastmod: now },
      { url: "/maple-ridge-town-centre-presale", priority: "0.9", changefreq: "weekly", lastmod: now },
    ];

    // Primary and secondary cities
    const primaryCities = ["surrey", "vancouver", "langley", "coquitlam", "burnaby", "richmond"];
    const secondaryCities = ["delta", "abbotsford", "port-coquitlam", "port-moody", "new-westminster",
      "north-vancouver", "white-rock", "maple-ridge", "chilliwack"];
    const allCities = [...primaryCities, ...secondaryCities];

    // City + Product type SEO pages - highest priority for sitelinks
    const cityProductPages = [
      // Primary cities get highest priority (0.95)
      ...primaryCities.flatMap(city => [
        { url: `/${city}-presale-condos`, priority: "0.95", changefreq: "daily", lastmod: now },
        { url: `/${city}-presale-townhomes`, priority: "0.95", changefreq: "daily", lastmod: now }
      ]),
      // Secondary cities get slightly lower priority
      ...secondaryCities.flatMap(city => [
        { url: `/${city}-presale-condos`, priority: "0.85", changefreq: "daily", lastmod: now },
        { url: `/${city}-presale-townhomes`, priority: "0.85", changefreq: "daily", lastmod: now }
      ])
    ];

    // Resale / Move-In Ready city pages with property types, price ranges, and bedrooms
    const resaleCityPages = allCities.flatMap(city => [
      { url: `/resale/${city}`, priority: "0.85", changefreq: "daily", lastmod: now },
      // Property types
      { url: `/resale/${city}/condos`, priority: "0.8", changefreq: "daily", lastmod: now },
      { url: `/resale/${city}/townhouses`, priority: "0.8", changefreq: "daily", lastmod: now },
      { url: `/resale/${city}/houses`, priority: "0.8", changefreq: "daily", lastmod: now },
      { url: `/resale/${city}/duplexes`, priority: "0.75", changefreq: "daily", lastmod: now },
      // Price ranges
      { url: `/resale/${city}/under-500k`, priority: "0.8", changefreq: "daily", lastmod: now },
      { url: `/resale/${city}/under-750k`, priority: "0.8", changefreq: "daily", lastmod: now },
      { url: `/resale/${city}/under-1m`, priority: "0.8", changefreq: "daily", lastmod: now },
      { url: `/resale/${city}/under-1.5m`, priority: "0.75", changefreq: "daily", lastmod: now },
      { url: `/resale/${city}/under-2m`, priority: "0.75", changefreq: "daily", lastmod: now },
      { url: `/resale/${city}/luxury`, priority: "0.75", changefreq: "daily", lastmod: now },
      // Bedroom counts
      { url: `/resale/${city}/1-bedroom`, priority: "0.8", changefreq: "daily", lastmod: now },
      { url: `/resale/${city}/2-bedroom`, priority: "0.8", changefreq: "daily", lastmod: now },
      { url: `/resale/${city}/3-bedroom`, priority: "0.8", changefreq: "daily", lastmod: now },
      { url: `/resale/${city}/4-bedroom`, priority: "0.75", changefreq: "daily", lastmod: now },
    ]);

    // Popular Searches SEO hub page
    const seoHubPages = [
      { url: "/resale/popular-searches", priority: "0.85", changefreq: "weekly", lastmod: now },
    ];

    // Top neighborhoods for SEO - neighborhood + property type pages
    const topNeighborhoods: Record<string, string[]> = {
      vancouver: ["downtown", "yaletown", "kitsilano", "mount-pleasant", "fairview"],
      surrey: ["city-centre", "fleetwood", "guildford", "south-surrey", "clayton"],
      burnaby: ["metrotown", "brentwood", "highgate", "edmonds"],
      richmond: ["city-centre", "steveston", "brighouse", "west-cambie"],
      langley: ["willoughby", "walnut-grove", "murrayville", "yorkson"],
      coquitlam: ["burke-mountain", "burquitlam", "westwood-plateau"],
      "new-westminster": ["downtown", "sapperton", "queensborough"],
      "port-moody": ["suter-brook", "heritage-woods", "moody-centre"],
    };

    const neighborhoodPropertyPages = Object.entries(topNeighborhoods).flatMap(([city, neighborhoods]) =>
      neighborhoods.flatMap(neighborhood => [
        { url: `/resale/${city}/${neighborhood}/condos`, priority: "0.75", changefreq: "daily", lastmod: now },
        { url: `/resale/${city}/${neighborhood}/townhomes`, priority: "0.75", changefreq: "daily", lastmod: now },
        { url: `/resale/${city}/${neighborhood}/homes`, priority: "0.7", changefreq: "daily", lastmod: now },
      ])
    );

    // Price-based SEO pages - only for routes that exist
    const pricePoints = ["500k", "700k", "900k", "1000k"];
    const priceCities = primaryCities;
    const pricePages = priceCities.flatMap(city => 
      pricePoints.flatMap(price => [
        { url: `/presale-condos-under-${price}-${city}`, priority: "0.8", changefreq: "daily", lastmod: now },
        { url: `/presale-townhomes-under-${price}-${city}`, priority: "0.8", changefreq: "daily", lastmod: now }
      ])
    );

    // Fetch presale projects with neighborhood data for SEO URLs
    const { data: projects } = await supabase
      .from("presale_projects")
      .select("slug, neighborhood, city, project_type, updated_at")
      .eq("is_published", true)
      .eq("is_indexed", true);

    // Generate SEO-friendly project URLs
    const projectPages = (projects || []).map(p => {
      const neighborhoodSlug = slugify(p.neighborhood || p.city);
      const typeSlug = getProjectTypeSlug(p.project_type);
      const seoUrl = `/${neighborhoodSlug}-presale-${typeSlug}-${p.slug}`;
      
      return {
        url: seoUrl,
        lastmod: p.updated_at?.split("T")[0] || now,
        priority: "0.9",
        changefreq: "weekly"
      };
    });

    // Collect unique neighborhoods for neighborhood landing pages
    const neighborhoodsSet = new Set<string>();
    (projects || []).forEach(p => {
      if (p.neighborhood && p.city) {
        const citySlug = slugify(p.city);
        const neighborhoodSlug = slugify(p.neighborhood);
        neighborhoodsSet.add(`/${citySlug}-${neighborhoodSlug}-presale`);
      }
    });
    
    const neighborhoodPages = Array.from(neighborhoodsSet).map(url => ({
      url,
      priority: "0.85",
      changefreq: "weekly",
      lastmod: now
    }));

    // Fetch blog posts
    const { data: posts } = await supabase
      .from("blog_posts")
      .select("slug, updated_at, category")
      .eq("is_published", true);

    const blogPages = (posts || []).map(p => {
      const isHighPriority = p.slug?.includes('presale') || 
                             p.slug?.includes('first-time-buyer') ||
                             p.slug?.includes('investment') ||
                             p.category === 'Buyer Education';
      return {
        url: `/blog/${p.slug}`,
        lastmod: p.updated_at?.split("T")[0] || now,
        priority: isHighPriority ? "0.85" : "0.75",
        changefreq: "monthly"
      };
    });

    // Fetch assignment listings
    const { data: listings } = await supabase
      .from("listings")
      .select("id, updated_at")
      .eq("status", "published");

    const listingPages = (listings || []).map(l => ({
      url: `/assignments/${l.id}`,
      lastmod: l.updated_at?.split("T")[0] || now,
      priority: "0.75",
      changefreq: "weekly"
    }));

    // Fetch MLS resale listings - HIGH SEO VALUE
    const { data: mlsListings } = await supabase
      .from("mls_listings")
      .select("listing_key, updated_at")
      .eq("status", "Active")
      .limit(5000); // Limit to prevent sitemap bloat

    const mlsListingPages = (mlsListings || []).map(l => ({
      url: `/resale/${l.listing_key}`,
      lastmod: l.updated_at?.split("T")[0] || now,
      priority: "0.7",
      changefreq: "daily"
    }));

    console.log(`Sitemap: ${mlsListingPages.length} MLS listings added`);

    // Build XML - note: order matters for crawl priority
    const allPages = [
      ...staticPages,
      ...cityProductPages,
      ...seoHubPages,
      ...projectPages, // Projects now have SEO-friendly URLs and high priority
      ...neighborhoodPages,
      ...resaleCityPages,
      ...neighborhoodPropertyPages,
      ...pricePages,
      ...blogPages,
      ...listingPages,
      ...mlsListingPages, // Individual resale listings - high SEO value
    ];
    
    const urlEntries = allPages.map(page => `
  <url>
    <loc>${SITE_URL}${page.url}</loc>
    <lastmod>${page.lastmod || now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join("");

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;

    // Log generation stats
    const totalUrls = allPages.length;
    console.log(`Sitemap generated: ${totalUrls} URLs total`);
    console.log(`- Static pages: ${staticPages.length}`);
    console.log(`- City/Product pages: ${cityProductPages.length}`);
    console.log(`- Presale projects: ${projectPages.length}`);
    console.log(`- Neighborhood pages: ${neighborhoodPages.length}`);
    console.log(`- Blog posts: ${blogPages.length}`);
    console.log(`- MLS listings: ${mlsListingPages.length}`);

    // Store generation timestamp for monitoring
    await supabase
      .from("app_settings")
      .upsert({
        key: "sitemap_last_generated",
        value: { timestamp: new Date().toISOString(), url_count: totalUrls },
        updated_at: new Date().toISOString()
      }, { onConflict: "key" });

    return new Response(sitemap, {
      headers: corsHeaders,
    });
  } catch (error: unknown) {
    console.error("Sitemap generation error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(`Error generating sitemap: ${message}`, {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }
});
