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

    // Static pages
    const staticPages: { url: string; priority: string; changefreq: string; lastmod?: string }[] = [
      { url: "/", priority: "1.0", changefreq: "daily", lastmod: now },
      { url: "/presale-projects", priority: "0.9", changefreq: "daily", lastmod: now },
      { url: "/assignments", priority: "0.9", changefreq: "daily", lastmod: now },
      { url: "/resale", priority: "0.9", changefreq: "daily", lastmod: now },
      { url: "/map-search", priority: "0.85", changefreq: "daily", lastmod: now },
      { url: "/blog", priority: "0.8", changefreq: "weekly", lastmod: now },
      { url: "/buyers-guide", priority: "0.85", changefreq: "monthly", lastmod: now },
      { url: "/presale-guide", priority: "0.85", changefreq: "monthly", lastmod: now },
      { url: "/calculator", priority: "0.85", changefreq: "monthly", lastmod: now },
      { url: "/mortgage-calculator", priority: "0.8", changefreq: "monthly", lastmod: now },
      { url: "/about", priority: "0.6", changefreq: "monthly", lastmod: now },
      { url: "/contact", priority: "0.6", changefreq: "monthly", lastmod: now },
      { url: "/developers", priority: "0.7", changefreq: "monthly", lastmod: now },
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

    // Resale / Move-In Ready city pages
    const resaleCityPages = allCities.flatMap(city => [
      { url: `/resale/${city}`, priority: "0.85", changefreq: "daily", lastmod: now },
      { url: `/resale/${city}/condos`, priority: "0.8", changefreq: "daily", lastmod: now },
      { url: `/resale/${city}/townhouses`, priority: "0.8", changefreq: "daily", lastmod: now },
      { url: `/resale/${city}/houses`, priority: "0.8", changefreq: "daily", lastmod: now },
    ]);

    // Price-based SEO pages
    const pricePoints = ["500k", "700k", "900k", "1000k"];
    const priceCities = primaryCities;
    const pricePages = priceCities.flatMap(city => 
      pricePoints.flatMap(price => [
        { url: `/presale-condos-under-${price}-${city}`, priority: "0.8", changefreq: "daily", lastmod: now },
        { url: `/presale-townhomes-under-${price}-${city}`, priority: "0.8", changefreq: "daily", lastmod: now }
      ])
    );

    // Investment and filter pages
    const filterPages = [
      { url: "/investment-presale-properties", priority: "0.8", changefreq: "weekly", lastmod: now },
      { url: "/presale-townhomes-under-500k", priority: "0.8", changefreq: "weekly", lastmod: now },
      { url: "/presale-condos-under-400k", priority: "0.8", changefreq: "weekly", lastmod: now },
    ];

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

    // Build XML - note: order matters for crawl priority
    const allPages = [
      ...staticPages,
      ...cityProductPages,
      ...projectPages, // Projects now have SEO-friendly URLs and high priority
      ...neighborhoodPages,
      ...resaleCityPages,
      ...pricePages,
      ...filterPages,
      ...blogPages,
      ...listingPages
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
