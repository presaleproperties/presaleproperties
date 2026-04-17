import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://presaleproperties.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/xml",
};

const SITE_URL = "https://presaleproperties.com";

const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
};

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

interface SitemapEntry {
  url: string;
  priority: string;
  changefreq: string;
  lastmod?: string;
}

const buildUrlEntry = (page: SitemapEntry, now: string) => `
  <url>
    <loc>${SITE_URL}${page.url}</loc>
    <lastmod>${page.lastmod || now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;

const buildSitemapXml = (entries: SitemapEntry[], now: string) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(e => buildUrlEntry(e, now)).join("")}
</urlset>`;

/**
 * CLEAN SITEMAP GENERATOR — v2
 * 
 * Only includes ~400 permanent, high-value URLs.
 * 
 * INCLUDES:
 * ✅ Homepage & static pages
 * ✅ /presale-projects/{city} and /presale-projects/{city}/{type}
 * ✅ /presale-projects/{city}/{type}-under-{price} (data-validated)
 * ✅ Neighborhood landing pages
 * ✅ Active presale project detail pages
 * ✅ Published blog posts
 * ✅ /properties/{city} city pages (NOT individual listings)
 * 
 * EXCLUDES:
 * ❌ ALL /properties/{slug} individual MLS listings
 * ❌ ALL /resale/* pages
 * ❌ /map-search
 * ❌ Any URL with query parameters
 * ❌ Any URL that redirects
 * ❌ /login, /admin, /dashboard, /buyer, /developer-portal
 * 
 * Supports ?type= query param to return individual sub-sitemaps:
 *   ?type=pages     → static + city + neighborhood pages
 *   ?type=projects  → presale project detail pages
 *   ?type=guides    → blog posts
 *   ?type=index     → sitemap index XML
 *   (no param)      → full combined sitemap
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const sitemapType = url.searchParams.get("type");
    const now = new Date().toISOString().split("T")[0];

    // ==========================================
    // SITEMAP INDEX — returns links to sub-sitemaps
    // ==========================================
    if (sitemapType === "index") {
      const baseUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-sitemap`;
      const indexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}?type=pages</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}?type=projects</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}?type=guides</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}?type=images</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
</sitemapindex>`;
      return new Response(indexXml, { headers: corsHeaders });
    }

    // ==========================================
    // 1. STATIC CORE PAGES
    // ==========================================
    const staticPages: SitemapEntry[] = [
      { url: "/", priority: "1.0", changefreq: "daily", lastmod: now },
      { url: "/presale-projects", priority: "1.0", changefreq: "daily", lastmod: now },
      { url: "/properties", priority: "0.9", changefreq: "daily", lastmod: now },
      { url: "/assignments", priority: "0.85", changefreq: "daily", lastmod: now },
      { url: "/assignments/sell-your-assignment", priority: "0.8", changefreq: "monthly", lastmod: now },
      { url: "/assignments/buying-an-assignment", priority: "0.8", changefreq: "monthly", lastmod: now },
      { url: "/for-agents", priority: "0.8", changefreq: "weekly", lastmod: now },
      { url: "/buyers-guide", priority: "0.85", changefreq: "monthly", lastmod: now },
      { url: "/presale-guide", priority: "0.85", changefreq: "monthly", lastmod: now },
      { url: "/presale-process", priority: "0.8", changefreq: "monthly", lastmod: now },
      { url: "/deficiency-walkthrough-guide", priority: "0.7", changefreq: "monthly", lastmod: now },
      { url: "/blog", priority: "0.8", changefreq: "weekly", lastmod: now },
      { url: "/guides", priority: "0.8", changefreq: "weekly", lastmod: now },
      { url: "/roi-calculator", priority: "0.8", changefreq: "monthly", lastmod: now },
      { url: "/mortgage-calculator", priority: "0.75", changefreq: "monthly", lastmod: now },
      { url: "/calculator", priority: "0.75", changefreq: "monthly", lastmod: now },
      { url: "/presale-projects-completing-2026", priority: "0.9", changefreq: "weekly", lastmod: now },
      { url: "/presale-projects-completing-2027", priority: "0.9", changefreq: "weekly", lastmod: now },
      { url: "/presale-projects-completing-2028", priority: "0.85", changefreq: "weekly", lastmod: now },
      { url: "/about", priority: "0.5", changefreq: "monthly", lastmod: now },
      { url: "/contact", priority: "0.5", changefreq: "monthly", lastmod: now },
      { url: "/developers", priority: "0.6", changefreq: "weekly", lastmod: now },
      { url: "/faq", priority: "0.5", changefreq: "monthly", lastmod: now },
      { url: "/terms-of-service", priority: "0.3", changefreq: "yearly", lastmod: now },
    ];

    // ==========================================
    // 2. CITY + TYPE + PRICE PAGES (data-validated)
    // ==========================================
    const primaryCities = ["surrey", "vancouver", "langley", "coquitlam", "burnaby", "richmond"];
    const secondaryCities = ["delta", "abbotsford", "port-coquitlam", "port-moody",
      "new-westminster", "north-vancouver", "white-rock", "maple-ridge"];
    const allCities = [...primaryCities, ...secondaryCities];
    const propertyTypes = ["condos", "townhomes"];
    const pricePoints = ["500k", "600k", "700k", "800k", "900k", "1m"];
    const PRICE_MAX_MAP: Record<string, number> = {
      "500k": 500000, "600k": 600000, "700k": 700000,
      "800k": 800000, "900k": 900000, "1m": 1000000
    };
    const TYPE_DB_MAP: Record<string, string> = { "condos": "condo", "townhomes": "townhome" };

    const { data: allProjects } = await supabase
      .from("presale_projects")
      .select("slug, neighborhood, city, project_type, starting_price, updated_at, status, is_indexed")
      .eq("is_published", true);

    const publishedProjects = allProjects || [];
    const indexableProjects = publishedProjects.filter(p => p.is_indexed !== false);

    const citiesWithProjects = new Set(
      indexableProjects.map(p => p.city?.toLowerCase().replace(/\s+/g, "-").trim())
    );
    const citiesWithCondos = new Set(
      indexableProjects.filter(p => p.project_type === "condo").map(p => p.city?.toLowerCase().replace(/\s+/g, "-").trim())
    );
    const citiesWithTownhomes = new Set(
      indexableProjects.filter(p => p.project_type === "townhome").map(p => p.city?.toLowerCase().replace(/\s+/g, "-").trim())
    );

    // City hub pages
    const cityHubPages: SitemapEntry[] = allCities
      .filter(city => citiesWithProjects.has(city))
      .map(city => ({
        url: `/presale-projects/${city}`,
        priority: primaryCities.includes(city) ? "0.9" : "0.8",
        changefreq: "daily" as const,
        lastmod: now
      }));

    // City + type pages
    const cityTypePages: SitemapEntry[] = [];
    for (const city of allCities) {
      if (citiesWithCondos.has(city)) {
        cityTypePages.push({
          url: `/presale-projects/${city}/condos`,
          priority: primaryCities.includes(city) ? "0.9" : "0.7",
          changefreq: "daily",
          lastmod: now
        });
      }
      if (citiesWithTownhomes.has(city)) {
        cityTypePages.push({
          url: `/presale-projects/${city}/townhomes`,
          priority: primaryCities.includes(city) ? "0.9" : "0.7",
          changefreq: "daily",
          lastmod: now
        });
      }
    }

    // City + type + price pages (only if real data exists)
    const cityTypePricePages: SitemapEntry[] = [];
    for (const city of allCities) {
      for (const type of propertyTypes) {
        for (const price of pricePoints) {
          const maxPrice = PRICE_MAX_MAP[price];
          const dbType = TYPE_DB_MAP[type];
          const hasMatch = indexableProjects.some(p =>
            p.city?.toLowerCase().replace(/\s+/g, "-") === city &&
            p.project_type === dbType &&
            p.starting_price != null &&
            p.starting_price <= maxPrice
          );
          if (hasMatch) {
            cityTypePricePages.push({
              url: `/presale-projects/${city}/${type}-under-${price}`,
              priority: primaryCities.includes(city) ? "0.7" : "0.6",
              changefreq: "weekly",
              lastmod: now
            });
          }
        }
      }
    }

    // Neighborhood landing pages
    const neighborhoodLandingPages: SitemapEntry[] = [
      { url: "/burnaby-brentwood-presale", priority: "0.8", changefreq: "weekly", lastmod: now },
      { url: "/burnaby-metrotown-presale", priority: "0.8", changefreq: "weekly", lastmod: now },
      { url: "/surrey-cloverdale-presale", priority: "0.8", changefreq: "weekly", lastmod: now },
      { url: "/south-surrey-presale", priority: "0.8", changefreq: "weekly", lastmod: now },
      { url: "/langley-willoughby-presale", priority: "0.8", changefreq: "weekly", lastmod: now },
      { url: "/surrey-city-centre-presale", priority: "0.8", changefreq: "weekly", lastmod: now },
      { url: "/coquitlam-burquitlam-presale", priority: "0.8", changefreq: "weekly", lastmod: now },
      { url: "/vancouver-mount-pleasant-presale", priority: "0.8", changefreq: "weekly", lastmod: now },
      { url: "/richmond-brighouse-presale", priority: "0.8", changefreq: "weekly", lastmod: now },
      { url: "/north-vancouver-lonsdale-presale", priority: "0.8", changefreq: "weekly", lastmod: now },
      { url: "/new-westminster-downtown-presale", priority: "0.8", changefreq: "weekly", lastmod: now },
      { url: "/maple-ridge-town-centre-presale", priority: "0.8", changefreq: "weekly", lastmod: now },
    ];

    // /properties/{city} pages (city landing pages only — NO individual listings)
    const propertiesCities = [...allCities, "west-vancouver", "chilliwack"];
    const propertiesCityPages: SitemapEntry[] = propertiesCities.map(city => ({
      url: `/properties/${city}`,
      priority: primaryCities.includes(city) ? "0.8" : "0.7",
      changefreq: "daily",
      lastmod: now
    }));

    // ==========================================
    // 3. PRESALE PROJECT DETAIL PAGES
    // ==========================================
    const projectPages: SitemapEntry[] = indexableProjects.map(p => {
      const neighborhoodSlug = slugify(p.neighborhood || p.city);
      const typeSlug = getProjectTypeSlug(p.project_type);
      return {
        url: `/${neighborhoodSlug}-presale-${typeSlug}-${p.slug}`,
        lastmod: p.updated_at?.split("T")[0] || now,
        priority: "0.8",
        changefreq: "weekly"
      };
    });

    // ==========================================
    // 4. BLOG POSTS
    // ==========================================
    const { data: posts } = await supabase
      .from("blog_posts")
      .select("slug, updated_at, category")
      .eq("is_published", true);

    const blogPages: SitemapEntry[] = (posts || []).map(p => ({
      url: `/blog/${p.slug}`,
      lastmod: p.updated_at?.split("T")[0] || now,
      priority: "0.7",
      changefreq: "monthly"
    }));

    // ==========================================
    // RETURN BASED ON TYPE
    // ==========================================
    const pagesEntries = [
      ...staticPages,
      ...cityHubPages,
      ...cityTypePages,
      ...cityTypePricePages,
      ...neighborhoodLandingPages,
      ...propertiesCityPages,
    ];

    let responseEntries: SitemapEntry[];
    if (sitemapType === "pages") {
      responseEntries = pagesEntries;
    } else if (sitemapType === "projects") {
      responseEntries = projectPages;
    } else if (sitemapType === "guides") {
      responseEntries = blogPages;
    } else {
      // Full combined sitemap (default)
      responseEntries = [...pagesEntries, ...projectPages, ...blogPages];
    }

    const totalUrls = responseEntries.length;
    console.log(`✅ Sitemap generated (type=${sitemapType || "full"}): ${totalUrls} URLs`);
    console.log(`  - Static: ${staticPages.length}, City hub: ${cityHubPages.length}`);
    console.log(`  - City+type: ${cityTypePages.length}, City+type+price: ${cityTypePricePages.length}`);
    console.log(`  - Neighborhoods: ${neighborhoodLandingPages.length}`);
    console.log(`  - Properties cities: ${propertiesCityPages.length}`);
    console.log(`  - Projects: ${projectPages.length}, Blog: ${blogPages.length}`);
    console.log(`  ❌ MLS listings: 0 (removed — volatile content)`);

    // Store stats
    await supabase
      .from("app_settings")
      .upsert({
        key: "sitemap_last_generated",
        value: {
          timestamp: new Date().toISOString(),
          url_count: pagesEntries.length + projectPages.length + blogPages.length,
          breakdown: {
            static: staticPages.length,
            cityHub: cityHubPages.length,
            cityType: cityTypePages.length,
            cityTypePrice: cityTypePricePages.length,
            neighborhoods: neighborhoodLandingPages.length,
            propertiesCities: propertiesCityPages.length,
            projects: projectPages.length,
            blog: blogPages.length,
            mlsListings: 0,
          }
        },
        updated_at: new Date().toISOString()
      }, { onConflict: "key" });

    return new Response(buildSitemapXml(responseEntries, now), { headers: corsHeaders });
  } catch (error: unknown) {
    console.error("Sitemap generation error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(`Error generating sitemap: ${message}`, {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }
});
