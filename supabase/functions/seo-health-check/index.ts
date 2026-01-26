import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://presaleproperties.com";

// Expected city pages that MUST be in sitemap
const PRIMARY_CITIES = ["surrey", "vancouver", "langley", "coquitlam", "burnaby", "richmond"];
const SECONDARY_CITIES = ["delta", "abbotsford", "port-coquitlam", "port-moody", 
  "new-westminster", "north-vancouver", "white-rock", "maple-ridge"];

interface Issue {
  type: string;
  severity: "error" | "warning" | "info";
  message: string;
  url?: string;
  details?: string;
}

interface CityPageStatus {
  city: string;
  condosUrl: string;
  townhomesUrl: string;
  condosInSitemap: boolean;
  townhomesInSitemap: boolean;
  isPrimary: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Create health check record
  const { data: checkRecord, error: insertError } = await supabase
    .from("seo_health_checks")
    .insert({
      check_type: "weekly_full",
      status: "running",
    })
    .select()
    .single();

  if (insertError) {
    console.error("Failed to create health check record:", insertError);
    return new Response(JSON.stringify({ error: "Failed to start health check" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const checkId = checkRecord.id;
  const issues: Issue[] = [];
  const warnings: Issue[] = [];

  try {
    console.log("🔍 Starting SEO Health Check...");

    // ==========================================
    // 1. FETCH AND ANALYZE SITEMAP
    // ==========================================
    console.log("📋 Fetching sitemap...");
    
    let sitemapUrls: string[] = [];
    let sitemapUrlCount = 0;
    let sitemapBreakdown = {};

    try {
      const sitemapResponse = await fetch(`${SITE_URL}/sitemap.xml`);
      if (sitemapResponse.ok) {
        const sitemapXml = await sitemapResponse.text();
        
        // Extract all URLs from sitemap
        const urlMatches = sitemapXml.match(/<loc>([^<]+)<\/loc>/g) || [];
        sitemapUrls = urlMatches.map(match => match.replace(/<\/?loc>/g, ""));
        sitemapUrlCount = sitemapUrls.length;
        
        // Categorize URLs
        const staticPages = sitemapUrls.filter(u => 
          !u.includes("-presale-") && !u.includes("/blog/") && 
          !u.includes("/developers/") && !u.includes("/properties/")
        );
        const cityPages = sitemapUrls.filter(u => 
          u.match(/\/[a-z-]+-presale-(condos|townhomes)$/)
        );
        const projectPages = sitemapUrls.filter(u => 
          u.match(/\/[a-z-]+-presale-(condos|townhomes|homes|duplexes)-[a-z0-9-]+$/)
        );
        const blogPages = sitemapUrls.filter(u => u.includes("/blog/"));
        const developerPages = sitemapUrls.filter(u => u.includes("/developers/"));
        const propertiesPages = sitemapUrls.filter(u => u.includes("/properties/"));
        
        sitemapBreakdown = {
          total: sitemapUrlCount,
          static: staticPages.length,
          cityPresale: cityPages.length,
          projects: projectPages.length,
          blog: blogPages.length,
          developers: developerPages.length,
          properties: propertiesPages.length,
        };

        console.log(`✅ Sitemap fetched: ${sitemapUrlCount} URLs`);

        // Check for sitemap size issues
        if (sitemapUrlCount < 100) {
          issues.push({
            type: "sitemap_too_small",
            severity: "warning",
            message: `Sitemap has only ${sitemapUrlCount} URLs (expected 150-300)`,
            details: "Low URL count may indicate missing pages or generation issues",
          });
        } else if (sitemapUrlCount > 500) {
          issues.push({
            type: "sitemap_too_large",
            severity: "warning",
            message: `Sitemap has ${sitemapUrlCount} URLs (target: 150-300)`,
            details: "Large sitemap may dilute crawl budget",
          });
        }

        // Check for project pages
        if (projectPages.length === 0) {
          issues.push({
            type: "no_project_pages",
            severity: "error",
            message: "No presale project pages found in sitemap",
            details: "Check project status filtering in generate-sitemap function",
          });
        }

      } else {
        issues.push({
          type: "sitemap_fetch_failed",
          severity: "error",
          message: `Failed to fetch sitemap: HTTP ${sitemapResponse.status}`,
          url: `${SITE_URL}/sitemap.xml`,
        });
      }
    } catch (sitemapError) {
      issues.push({
        type: "sitemap_error",
        severity: "error",
        message: `Sitemap fetch error: ${sitemapError instanceof Error ? sitemapError.message : "Unknown"}`,
        url: `${SITE_URL}/sitemap.xml`,
      });
    }

    // ==========================================
    // 2. CHECK CITY PAGES IN SITEMAP
    // ==========================================
    console.log("🏙️ Checking city pages...");
    
    const cityPagesStatus: CityPageStatus[] = [];
    const allCities = [...PRIMARY_CITIES, ...SECONDARY_CITIES];

    for (const city of allCities) {
      const condosUrl = `${SITE_URL}/${city}-presale-condos`;
      const townhomesUrl = `${SITE_URL}/${city}-presale-townhomes`;
      const isPrimary = PRIMARY_CITIES.includes(city);

      const status: CityPageStatus = {
        city,
        condosUrl,
        townhomesUrl,
        condosInSitemap: sitemapUrls.includes(condosUrl),
        townhomesInSitemap: sitemapUrls.includes(townhomesUrl),
        isPrimary,
      };

      cityPagesStatus.push(status);

      // Report missing city pages
      if (!status.condosInSitemap) {
        issues.push({
          type: "city_page_missing",
          severity: isPrimary ? "error" : "warning",
          message: `${city.charAt(0).toUpperCase() + city.slice(1)} presale condos page missing from sitemap`,
          url: condosUrl,
        });
      }
      if (!status.townhomesInSitemap) {
        issues.push({
          type: "city_page_missing",
          severity: isPrimary ? "error" : "warning",
          message: `${city.charAt(0).toUpperCase() + city.slice(1)} presale townhomes page missing from sitemap`,
          url: townhomesUrl,
        });
      }
    }

    const citiesInSitemap = cityPagesStatus.filter(c => c.condosInSitemap && c.townhomesInSitemap).length;
    console.log(`✅ City pages checked: ${citiesInSitemap}/${allCities.length} complete`);

    // ==========================================
    // 3. CHECK FOR NOINDEX PAGES IN SITEMAP
    // ==========================================
    console.log("🚫 Checking for noindex pages in sitemap...");
    
    // Pages that should NOT be in sitemap
    const noindexPatterns = [
      /\/map-search/,
      /\?city=/,
      /\?type=/,
      /\?price=/,
      /\?lat=/,
      /\?lng=/,
      /\?zoom=/,
      /\?sort=/,
      /\?view=/,
      /\?page=/,
    ];

    for (const url of sitemapUrls) {
      for (const pattern of noindexPatterns) {
        if (pattern.test(url)) {
          issues.push({
            type: "noindex_in_sitemap",
            severity: "error",
            message: `Noindex URL found in sitemap: ${url}`,
            url,
            details: "Filter/parameter URLs should not be in sitemap",
          });
          break;
        }
      }
    }

    // ==========================================
    // 4. CHECK DATABASE FOR INDEXABLE PROJECTS
    // ==========================================
    console.log("📊 Checking database project status...");
    
    const { data: projects, error: projectsError } = await supabase
      .from("presale_projects")
      .select("slug, name, status, is_published, is_indexed, city, neighborhood")
      .eq("is_published", true)
      .eq("is_indexed", true);

    if (projectsError) {
      warnings.push({
        type: "db_query_error",
        severity: "warning",
        message: `Failed to query projects: ${projectsError.message}`,
      });
    } else {
      const activeProjects = projects?.filter(p => p.status === "active") || [];
      const indexableProjectCount = activeProjects.length;
      
      // Check if all indexable projects are in sitemap
      const projectsNotInSitemap = activeProjects.filter(p => {
        // Try to find the project in sitemap URLs
        return !sitemapUrls.some(url => url.includes(p.slug));
      });

      if (projectsNotInSitemap.length > 0) {
        issues.push({
          type: "projects_missing_from_sitemap",
          severity: "warning",
          message: `${projectsNotInSitemap.length} active projects not found in sitemap`,
          details: projectsNotInSitemap.slice(0, 5).map(p => p.name).join(", "),
        });
      }

      console.log(`✅ Database check: ${indexableProjectCount} active projects, ${projectsNotInSitemap.length} missing from sitemap`);
    }

    // ==========================================
    // 5. CHECK app_settings FOR SITEMAP METADATA
    // ==========================================
    console.log("⚙️ Checking sitemap generation metadata...");
    
    const { data: sitemapSetting } = await supabase
      .from("app_settings")
      .select("value, updated_at")
      .eq("key", "sitemap_last_generated")
      .single();

    if (sitemapSetting) {
      const lastGenerated = new Date(sitemapSetting.value?.timestamp);
      const hoursSinceGeneration = (Date.now() - lastGenerated.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceGeneration > 48) {
        warnings.push({
          type: "sitemap_stale",
          severity: "warning",
          message: `Sitemap last generated ${Math.round(hoursSinceGeneration)} hours ago`,
          details: `Last generation: ${lastGenerated.toISOString()}`,
        });
      }
    }

    // ==========================================
    // 6. GENERATE SUMMARY
    // ==========================================
    const errorCount = issues.filter(i => i.severity === "error").length;
    const warningCount = issues.filter(i => i.severity === "warning").length + warnings.length;
    
    let summary = "";
    if (errorCount === 0 && warningCount === 0) {
      summary = `✅ SEO Health Check passed! Sitemap contains ${sitemapUrlCount} URLs. All ${citiesInSitemap} city pages indexed.`;
    } else if (errorCount === 0) {
      summary = `⚠️ SEO Health Check completed with ${warningCount} warnings. Sitemap: ${sitemapUrlCount} URLs.`;
    } else {
      summary = `❌ SEO Health Check found ${errorCount} errors and ${warningCount} warnings. Review required.`;
    }

    console.log(summary);

    // ==========================================
    // 7. UPDATE HEALTH CHECK RECORD
    // ==========================================
    await supabase
      .from("seo_health_checks")
      .update({
        status: "completed",
        sitemap_url_count: sitemapUrlCount,
        sitemap_breakdown: sitemapBreakdown,
        issues: issues,
        warnings: warnings,
        city_pages_status: cityPagesStatus,
        summary: summary,
        completed_at: new Date().toISOString(),
      })
      .eq("id", checkId);

    return new Response(JSON.stringify({
      success: true,
      checkId,
      summary,
      sitemapUrlCount,
      sitemapBreakdown,
      issueCount: errorCount,
      warningCount,
      cityPagesIndexed: citiesInSitemap,
      totalCityPages: allCities.length * 2,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("SEO Health Check failed:", error);
    
    await supabase
      .from("seo_health_checks")
      .update({
        status: "failed",
        summary: `Health check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        completed_at: new Date().toISOString(),
      })
      .eq("id", checkId);

    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
