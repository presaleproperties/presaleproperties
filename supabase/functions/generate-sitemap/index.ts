import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://presaleproperties.com",
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

/**
 * Controlled Sitemap Generator
 * 
 * PART 5 — SITEMAP REBUILD
 * Target: 150-300 high-value URLs only
 * 
 * INCLUDES:
 * ✅ Homepage
 * ✅ Core city presale pages (/{city}-presale-condos, /{city}-presale-townhomes)
 * ✅ Active, indexable project pages
 * ✅ Blog posts
 * ✅ Developer directory pages (if content-rich)
 * ✅ Guide/educational pages
 * 
 * EXCLUDES:
 * ❌ /map-search
 * ❌ Filter URLs (?city=, ?type=, ?price=, etc.)
 * ❌ Parameter URLs (?lat=, ?lng=, ?zoom=)
 * ❌ Noindexed pages
 * ❌ Individual MLS listings (too volatile, handled by image sitemap)
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date().toISOString().split("T")[0];

    // ==========================================
    // 1. STATIC CORE PAGES (Highest Priority)
    // ==========================================
    const staticPages: { url: string; priority: string; changefreq: string; lastmod?: string }[] = [
      // Homepage - Maximum priority
      { url: "/", priority: "1.0", changefreq: "daily", lastmod: now },
      
      // Main listing hubs - optimized for Google sitelinks
      { url: "/presale-projects", priority: "0.95", changefreq: "daily", lastmod: now },
      { url: "/properties", priority: "0.95", changefreq: "daily", lastmod: now },
      { url: "/for-agents", priority: "0.9", changefreq: "weekly", lastmod: now },
      
      // Educational / Guide pages
      { url: "/buyers-guide", priority: "0.85", changefreq: "monthly", lastmod: now },
      { url: "/presale-guide", priority: "0.85", changefreq: "monthly", lastmod: now },
      { url: "/blog", priority: "0.8", changefreq: "weekly", lastmod: now },
      { url: "/guides", priority: "0.8", changefreq: "weekly", lastmod: now },
      
      // Tools (base URLs only — noindex only applies when query params present)
      { url: "/roi-calculator", priority: "0.8", changefreq: "monthly", lastmod: now },
      { url: "/mortgage-calculator", priority: "0.75", changefreq: "monthly", lastmod: now },
      { url: "/calculator", priority: "0.75", changefreq: "monthly", lastmod: now },
      
      // Company pages
      { url: "/about", priority: "0.6", changefreq: "monthly", lastmod: now },
      { url: "/contact", priority: "0.6", changefreq: "monthly", lastmod: now },
      { url: "/developers", priority: "0.7", changefreq: "weekly", lastmod: now },
      { url: "/presale-process", priority: "0.8", changefreq: "monthly", lastmod: now },
      { url: "/privacy", priority: "0.3", changefreq: "yearly", lastmod: now },
    ];
    
    // NOTE: /map-search is EXCLUDED (noindex page)

    // ==========================================
    // 2. PROGRAMMATIC SEO PAGES (NEW STRUCTURE)
    // ==========================================
    // City × Property Type × Price combinations for 1000+ pages
    const primaryCities = ["surrey", "vancouver", "langley", "coquitlam", "burnaby", "richmond"];
    const secondaryCities = ["delta", "abbotsford", "port-coquitlam", "port-moody", 
      "new-westminster", "north-vancouver", "white-rock", "maple-ridge"];
    const allCities = [...primaryCities, ...secondaryCities];
    const propertyTypes = ["condos", "townhomes"];
    const pricePoints = ["500k", "600k", "700k", "800k", "900k", "1m"];

    // City Hub Pages: /presale-projects/{city}
    const cityHubPages = allCities.map(city => ({
      url: `/presale-projects/${city}`,
      priority: primaryCities.includes(city) ? "0.95" : "0.85",
      changefreq: "daily",
      lastmod: now
    }));

    // City + Type Pages: /presale-projects/{city}/condos
    const cityTypePages = allCities.flatMap(city => 
      propertyTypes.map(type => ({
        url: `/presale-projects/${city}/${type}`,
        priority: primaryCities.includes(city) ? "0.9" : "0.8",
        changefreq: "daily",
        lastmod: now
      }))
    );

    // Price ceiling map for database-driven Soft 404 prevention
    const PRICE_MAX_MAP: Record<string, number> = {
      "500k": 500000, "600k": 600000, "700k": 700000,
      "800k": 800000, "900k": 900000, "1m": 1000000
    };
    const TYPE_DB_MAP: Record<string, string> = { "condos": "condo", "townhomes": "townhome" };

    // Fetch all published projects once for price/type/city matching
    const { data: allProjects } = await supabase
      .from("presale_projects")
      .select("city, project_type, starting_price")
      .eq("is_published", true)
      .eq("is_indexed", true);

    // City + Type + Price Pages — only generate if real content exists
    const cityTypePricePages: { url: string; priority: string; changefreq: string; lastmod: string }[] = [];
    for (const city of allCities) {
      for (const type of propertyTypes) {
        for (const price of pricePoints) {
          const maxPrice = PRICE_MAX_MAP[price];
          const dbType = TYPE_DB_MAP[type];
          const hasMatch = (allProjects || []).some(p =>
            p.city?.toLowerCase().replace(/\s+/g, "-") === city &&
            p.project_type === dbType &&
            p.starting_price != null &&
            p.starting_price <= maxPrice
          );
          if (hasMatch) {
            cityTypePricePages.push({
              url: `/presale-projects/${city}/${type}-under-${price}`,
              priority: primaryCities.includes(city) ? "0.85" : "0.75",
              changefreq: "weekly",
              lastmod: now
            });
          }
        }
      }
    }

    // ==========================================
    // 3. LEGACY CITY PAGES — REMOVED from sitemap
    // ==========================================
    // Legacy /{city}-presale-condos and /{city}-presale-townhomes
    // are 301 redirects to /presale-projects/{city}/condos|townhomes.
    // Google says: "Don't include redirecting URLs in your sitemap."
    // These redirects are handled in React Router and still crawlable via internal links.

    // ==========================================
    // 4. NEIGHBORHOOD LANDING PAGES
    // ==========================================
    const neighborhoodLandingPages = [
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

    // ==========================================
    // 5. PROPERTIES CITY PAGES (Clean URLs - /properties/{city})
    // ==========================================
    const propertiesCityPages = allCities.map(city => ({
      url: `/properties/${city}`,
      priority: primaryCities.includes(city) ? "0.9" : "0.8",
      changefreq: "daily",
      lastmod: now
    }));
    
    // Popular searches hub
    const seoHubPages = [
      { url: "/properties/popular-searches", priority: "0.8", changefreq: "weekly", lastmod: now },
    ];

    // ==========================================
    // 5. ALL PUBLISHED PRESALE PROJECTS (High Value)
    // ==========================================
    // Include ALL published projects (active, coming_soon, selling, etc.)
    // This ensures complete sitemap coverage
    const { data: projects } = await supabase
      .from("presale_projects")
      .select("slug, neighborhood, city, project_type, updated_at, status")
      .eq("is_published", true)
      .eq("is_indexed", true);
    // Note: Removed status filter to include all published projects

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

    // ==========================================
    // 6. ACTIVE MLS LISTING PAGES (Canonical Address URLs)
    // ==========================================
    // Include only Active listings with a full address slug to prevent Soft 404s.
    // This ensures Google discovers the canonical /properties/address-city-bc-id URL,
    // not the legacy /properties/{numericId} variants.
    // Cap at 500 most recent to manage sitemap size and crawl budget.
    const { data: activeListings } = await supabase
      .from("mls_listings")
      .select("listing_key, unparsed_address, street_number, street_name, street_suffix, unit_number, city, modification_timestamp")
      .eq("mls_status", "Active")
      .not("city", "is", null)
      .order("modification_timestamp", { ascending: false })
      .limit(500);

    const listingSlugify = (text: string): string =>
      text.toLowerCase().replace(/['']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-+/g, '-');

    const mlsListingPages = (activeListings || []).map(l => {
      const address = l.unparsed_address || [l.unit_number ? `#${l.unit_number}` : '', l.street_number, l.street_name, l.street_suffix].filter(Boolean).join(' ');
      if (!address || !l.city) return null;
      const addressSlug = listingSlugify(address);
      const citySlug = listingSlugify(l.city);
      return {
        url: `/properties/${addressSlug}-${citySlug}-bc-${l.listing_key}`,
        lastmod: l.modification_timestamp?.split("T")[0] || now,
        priority: "0.6",
        changefreq: "daily"
      };
    }).filter(Boolean) as { url: string; lastmod: string; priority: string; changefreq: string }[];

    // ==========================================
    // 7. BLOG POSTS
    // ==========================================
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
        priority: isHighPriority ? "0.8" : "0.7",
        changefreq: "monthly"
      };
    });

    // ==========================================
    // 7. DEVELOPER DIRECTORY PAGE (top-level only)
    // ==========================================
    // NOTE: /developers/:slug pages are redirected to /developers in App.tsx.
    // Individual developer slugs are intentionally excluded from the sitemap
    // to prevent "Page with redirect" errors in Google Search Console.
    const developerPages: { url: string; lastmod: string; priority: string; changefreq: string }[] = [];
    // Only the /developers hub is included in staticPages above.

    // ==========================================
    // BUILD CONTROLLED SITEMAP
    // ==========================================
    // IMPORTANT: Never include redirecting URLs — "Page with redirect" GSC error
    // Legacy /{city}-presale-condos, /presale-condos-{city} etc. are 301 redirects → EXCLUDED
    // Only canonical destination URLs are included
    const allPages = [
      ...staticPages,
      ...cityHubPages,               // /presale-projects/{city}
      ...cityTypePages,              // /presale-projects/{city}/condos
      ...cityTypePricePages,         // /presale-projects/{city}/condos-under-500k
      ...neighborhoodLandingPages,   // /burnaby-brentwood-presale etc. (these ARE canonical destinations)
      ...projectPages,               // /{neighborhood}-presale-{type}-{slug}
      ...propertiesCityPages,        // /properties/{city}
      ...seoHubPages,
      ...blogPages,
      // developerPages intentionally empty — /developers/:slug redirects to /developers
    ];
    
    // NOTE: Individual MLS listings are NOT included
    // They create sitemap bloat and volatility
    // Use image sitemap for listing photos instead
    
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
    const programmaticTotal = cityHubPages.length + cityTypePages.length + cityTypePricePages.length;
    console.log(`✅ Sitemap generated: ${totalUrls} URLs (target: 1000+)`);
    console.log(`  - Static pages: ${staticPages.length}`);
    console.log(`  - City hub pages: ${cityHubPages.length}`);
    console.log(`  - City + type pages: ${cityTypePages.length}`);
    console.log(`  - City + type + price pages: ${cityTypePricePages.length}`);
    console.log(`  - Total programmatic SEO: ${programmaticTotal}`);
    console.log(`  - Neighborhood pages: ${neighborhoodLandingPages.length}`);
    console.log(`  - Presale projects: ${projectPages.length}`);
    console.log(`  - Properties city pages: ${propertiesCityPages.length}`);
    console.log(`  - Blog posts: ${blogPages.length}`);
    console.log(`  - Developer pages: ${developerPages.length}`);

    // Store generation timestamp for monitoring
    await supabase
      .from("app_settings")
      .upsert({
        key: "sitemap_last_generated",
        value: { 
          timestamp: new Date().toISOString(), 
          url_count: totalUrls,
          breakdown: {
            static: staticPages.length,
            cityHub: cityHubPages.length,
            cityType: cityTypePages.length,
            cityTypePrice: cityTypePricePages.length,
            programmaticTotal,
            neighborhoods: neighborhoodLandingPages.length,
            projects: projectPages.length,
            propertiesCities: propertiesCityPages.length,
            blog: blogPages.length,
            developers: developerPages.length,
          }
        },
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
