import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/xml",
};

const SITE_URL = "https://presaleproperties.com";

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
      { url: "/blog", priority: "0.8", changefreq: "weekly", lastmod: now },
      { url: "/buyers-guide", priority: "0.8", changefreq: "monthly", lastmod: now },
      { url: "/about", priority: "0.6", changefreq: "monthly", lastmod: now },
      { url: "/contact", priority: "0.6", changefreq: "monthly", lastmod: now },
      { url: "/agents", priority: "0.7", changefreq: "monthly", lastmod: now },
    ];

    // City landing pages - high priority for sitelinks
    const cities = ["surrey", "langley", "coquitlam", "vancouver", "burnaby", "richmond",
      "delta", "abbotsford", "port-coquitlam", "port-moody", "new-westminster",
      "north-vancouver", "white-rock", "maple-ridge", "chilliwack"];
    
    // Primary city landing pages
    const cityPages = cities.map(city => ({
      url: `/presale-condos/${city}`,
      priority: "0.9",
      changefreq: "daily",
      lastmod: now
    }));

    // City + Product type SEO pages - highest priority for sitelinks after homepage
    // These are the primary pages for Google sitelinks (e.g., "Surrey Presale Condos", "Vancouver Presale Townhomes")
    const primaryCities = ["surrey", "vancouver", "langley", "coquitlam", "burnaby", "richmond"];
    const cityProductPages = [
      // Primary cities get highest priority (0.95) for better sitelink eligibility
      ...primaryCities.flatMap(city => [
        { url: `/${city}-presale-condos`, priority: "0.95", changefreq: "daily", lastmod: now },
        { url: `/${city}-presale-townhomes`, priority: "0.95", changefreq: "daily", lastmod: now }
      ]),
      // Secondary cities get slightly lower priority
      ...cities.filter(c => !primaryCities.includes(c)).flatMap(city => [
        { url: `/${city}-presale-condos`, priority: "0.85", changefreq: "daily", lastmod: now },
        { url: `/${city}-presale-townhomes`, priority: "0.85", changefreq: "daily", lastmod: now }
      ])
    ];

    // Price-based SEO pages
    const pricePoints = ["500k", "600k", "700k", "800k", "900k", "1000k"];
    const priceCities = ["surrey", "langley", "coquitlam", "burnaby", "vancouver", "richmond", "delta", "abbotsford"];
    const pricePages = priceCities.flatMap(city => 
      pricePoints.flatMap(price => [
        { url: `/presale-condos-under-${price}-${city}`, priority: "0.8", changefreq: "daily", lastmod: now },
        { url: `/presale-townhomes-under-${price}-${city}`, priority: "0.8", changefreq: "daily", lastmod: now }
      ])
    );

    // Fetch presale projects
    const { data: projects } = await supabase
      .from("presale_projects")
      .select("slug, updated_at")
      .eq("is_published", true)
      .eq("is_indexed", true);

    const projectPages = (projects || []).map(p => ({
      url: `/presale-projects/${p.slug}`,
      lastmod: p.updated_at?.split("T")[0] || now,
      priority: "0.8",
      changefreq: "weekly"
    }));

    // Fetch blog posts
    const { data: posts } = await supabase
      .from("blog_posts")
      .select("slug, updated_at")
      .eq("is_published", true);

    const blogPages = (posts || []).map(p => ({
      url: `/blog/${p.slug}`,
      lastmod: p.updated_at?.split("T")[0] || now,
      priority: "0.7",
      changefreq: "monthly"
    }));

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

    // Build XML
    const allPages = [...staticPages, ...cityPages, ...cityProductPages, ...pricePages, ...projectPages, ...blogPages, ...listingPages];
    
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
