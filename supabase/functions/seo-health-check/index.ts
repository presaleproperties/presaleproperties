import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://presaleproperties.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://presaleproperties.com";

// Expected city pages that MUST be in sitemap (NEW URL structure)
const PRIMARY_CITIES = ["surrey", "vancouver", "langley", "coquitlam", "burnaby", "richmond"];
const SECONDARY_CITIES = ["delta", "abbotsford", "port-coquitlam", "port-moody", 
  "new-westminster", "north-vancouver", "white-rock", "maple-ridge"];

interface Issue {
  type: string;
  severity: "error" | "warning" | "info";
  message: string;
  url?: string;
  details?: string;
  count?: number;
}

interface NonIndexedAnalysis {
  duplicateCanonical: { count: number; examples: string[] };
  thinContent: { count: number; examples: string[] };
  parameterUrls: { count: number; examples: string[] };
  redirectChains: { count: number; examples: string[] };
  blockedByRobots: { count: number; examples: string[] };
}

interface CityPageStatus {
  city: string;
  hubUrl: string;
  condosUrl: string;
  townhomesUrl: string;
  hubInSitemap: boolean;
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
    // 1. FETCH AND ANALYZE SITEMAP (from edge function directly)
    // ==========================================
    console.log("📋 Fetching sitemap from edge function...");
    
    let sitemapUrls: string[] = [];
    let sitemapUrlCount = 0;
    let sitemapBreakdown = {};

    try {
      // Fetch from the edge function directly (the static file is now a sitemap index)
      const sitemapResponse = await fetch(`${supabaseUrl}/functions/v1/generate-sitemap`, {
        headers: {
          "Authorization": `Bearer ${supabaseKey}`,
        }
      });
      
      if (sitemapResponse.ok) {
        const sitemapXml = await sitemapResponse.text();
        
        // Extract all URLs from sitemap
        const urlMatches = sitemapXml.match(/<loc>([^<]+)<\/loc>/g) || [];
        sitemapUrls = urlMatches.map(match => match.replace(/<\/?loc>/g, ""));
        sitemapUrlCount = sitemapUrls.length;
        
        // Categorize URLs using NEW URL structure
        const programmaticPages = sitemapUrls.filter(u => 
          u.match(/\/presale-projects\/[a-z-]+\/(condos|townhomes)/)
        );
        const cityHubPages = sitemapUrls.filter(u => 
          u.match(/\/presale-projects\/[a-z-]+$/)
        );
        const projectPages = sitemapUrls.filter(u => 
          u.match(/\/[a-z-]+-presale-(condos|townhomes|homes|duplexes)-[a-z0-9-]+$/)
        );
        const blogPages = sitemapUrls.filter(u => u.includes("/blog/"));
        const developerPages = sitemapUrls.filter(u => u.match(/\/developers\/[a-z]/));
        const propertiesPages = sitemapUrls.filter(u => u.match(/\/properties\/[a-z]/));
        const neighborhoodPages = sitemapUrls.filter(u => 
          u.match(/\/[a-z-]+-presale$/)
        );
        const staticPages = sitemapUrls.filter(u => 
          !programmaticPages.includes(u) && !cityHubPages.includes(u) &&
          !projectPages.includes(u) && !blogPages.includes(u) && 
          !developerPages.includes(u) && !propertiesPages.includes(u) &&
          !neighborhoodPages.includes(u)
        );
        
        sitemapBreakdown = {
          total: sitemapUrlCount,
          static: staticPages.length,
          cityHubs: cityHubPages.length,
          programmatic: programmaticPages.length,
          neighborhoods: neighborhoodPages.length,
          projects: projectPages.length,
          blog: blogPages.length,
          developers: developerPages.length,
          properties: propertiesPages.length,
        };

        console.log(`✅ Sitemap fetched: ${sitemapUrlCount} URLs`);
        console.log(`  Breakdown:`, JSON.stringify(sitemapBreakdown));

        // Check for sitemap size issues
        if (sitemapUrlCount < 100) {
          issues.push({
            type: "sitemap_too_small",
            severity: "error",
            message: `Sitemap has only ${sitemapUrlCount} URLs (expected 1000+)`,
            details: "Low URL count means programmatic pages or project pages are missing",
          });
        }

        // Check for project pages
        if (projectPages.length === 0) {
          issues.push({
            type: "no_project_pages",
            severity: "error",
            message: "No presale project pages found in sitemap",
            details: "Check is_published and is_indexed flags in presale_projects table",
          });
        }

      } else {
        issues.push({
          type: "sitemap_fetch_failed",
          severity: "error",
          message: `Failed to fetch sitemap: HTTP ${sitemapResponse.status}`,
        });
      }
    } catch (sitemapError) {
      issues.push({
        type: "sitemap_error",
        severity: "error",
        message: `Sitemap fetch error: ${sitemapError instanceof Error ? sitemapError.message : "Unknown"}`,
      });
    }

    // ==========================================
    // 2. CHECK CITY PAGES IN SITEMAP (NEW URL structure)
    // ==========================================
    console.log("🏙️ Checking city pages (new URL structure)...");
    
    const cityPagesStatus: CityPageStatus[] = [];
    const allCities = [...PRIMARY_CITIES, ...SECONDARY_CITIES];

    for (const city of allCities) {
      // NEW canonical URL structure
      const hubUrl = `${SITE_URL}/presale-projects/${city}`;
      const condosUrl = `${SITE_URL}/presale-projects/${city}/condos`;
      const townhomesUrl = `${SITE_URL}/presale-projects/${city}/townhomes`;
      const isPrimary = PRIMARY_CITIES.includes(city);

      const status: CityPageStatus = {
        city,
        hubUrl,
        condosUrl,
        townhomesUrl,
        hubInSitemap: sitemapUrls.includes(hubUrl),
        condosInSitemap: sitemapUrls.includes(condosUrl),
        townhomesInSitemap: sitemapUrls.includes(townhomesUrl),
        isPrimary,
      };

      cityPagesStatus.push(status);

      // Report missing city pages
      if (!status.hubInSitemap) {
        issues.push({
          type: "city_hub_missing",
          severity: isPrimary ? "error" : "warning",
          message: `${city} hub page missing from sitemap`,
          url: hubUrl,
        });
      }
      if (!status.condosInSitemap) {
        issues.push({
          type: "city_condos_missing",
          severity: isPrimary ? "error" : "warning",
          message: `${city} condos page missing from sitemap`,
          url: condosUrl,
        });
      }
      if (!status.townhomesInSitemap) {
        issues.push({
          type: "city_townhomes_missing",
          severity: isPrimary ? "error" : "warning",
          message: `${city} townhomes page missing from sitemap`,
          url: townhomesUrl,
        });
      }
    }

    const citiesFullyIndexed = cityPagesStatus.filter(c => 
      c.hubInSitemap && c.condosInSitemap && c.townhomesInSitemap
    ).length;
    console.log(`✅ City pages checked: ${citiesFullyIndexed}/${allCities.length} fully indexed`);

    // ==========================================
    // 3. CHECK FOR NOINDEX PAGES IN SITEMAP
    // ==========================================
    console.log("🚫 Checking for noindex/redirect pages in sitemap...");
    
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

    // Also check for legacy redirect URLs that shouldn't be in sitemap
    const legacyRedirectPattern = /\/[a-z-]+-presale-(condos|townhomes)$/;

    for (const url of sitemapUrls) {
      // Check noindex patterns
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
      
      // Check for legacy redirect URLs (should NOT be in sitemap)
      if (legacyRedirectPattern.test(url)) {
        const path = url.replace(SITE_URL, "");
        // Exclude neighborhood landing pages which are valid
        if (!path.match(/-(brentwood|metrotown|cloverdale|willoughby|city-centre|burquitlam|mount-pleasant|brighouse|lonsdale|downtown|town-centre)-presale$/)) {
          warnings.push({
            type: "redirect_in_sitemap",
            severity: "warning",
            message: `Legacy redirect URL in sitemap: ${url}`,
            url,
            details: "301 redirect URLs should not be in sitemap per Google guidelines",
          });
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
      const indexableProjects = projects || [];
      
      // Check if all indexable projects are in sitemap
      const projectsNotInSitemap = indexableProjects.filter(p => {
        return !sitemapUrls.some(url => url.includes(p.slug));
      });

      if (projectsNotInSitemap.length > 0) {
        issues.push({
          type: "projects_missing_from_sitemap",
          severity: "warning",
          message: `${projectsNotInSitemap.length} published projects not found in sitemap`,
          details: projectsNotInSitemap.slice(0, 5).map(p => p.name).join(", "),
          count: projectsNotInSitemap.length,
        });
      }

      console.log(`✅ Database check: ${indexableProjects.length} indexable projects, ${projectsNotInSitemap.length} missing from sitemap`);
    }

    // ==========================================
    // 5. CHECK SITEMAP GENERATION METADATA
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
    // 6. ANALYZE POTENTIAL NON-INDEXED REASONS
    // ==========================================
    console.log("🔎 Analyzing potential non-indexed page patterns...");
    
    const nonIndexedAnalysis: NonIndexedAnalysis = {
      duplicateCanonical: { count: 0, examples: [] },
      thinContent: { count: 0, examples: [] },
      parameterUrls: { count: 0, examples: [] },
      redirectChains: { count: 0, examples: [] },
      blockedByRobots: { count: 0, examples: [] },
    };

    // Check for potential thin content (blog posts without substantial content)
    const { data: blogPosts } = await supabase
      .from("blog_posts")
      .select("slug, content, title")
      .eq("is_published", true);

    if (blogPosts) {
      for (const post of blogPosts) {
        const contentLength = (post.content || "").length;
        if (contentLength < 500) {
          nonIndexedAnalysis.thinContent.count++;
          if (nonIndexedAnalysis.thinContent.examples.length < 5) {
            nonIndexedAnalysis.thinContent.examples.push(`/blog/${post.slug} (${contentLength} chars)`);
          }
        }
      }
      
      if (nonIndexedAnalysis.thinContent.count > 0) {
        warnings.push({
          type: "thin_content",
          severity: "warning",
          message: `${nonIndexedAnalysis.thinContent.count} blog posts have thin content (<500 chars)`,
          details: `Examples: ${nonIndexedAnalysis.thinContent.examples.join(", ")}`,
        });
      }
    }

    // Check for presale projects with missing required SEO fields
    const { data: projectsWithMissingSEO } = await supabase
      .from("presale_projects")
      .select("slug, name, seo_title, seo_description, short_description")
      .eq("is_published", true)
      .eq("is_indexed", true);

    let missingMetaCount = 0;
    const missingMetaExamples: string[] = [];
    
    if (projectsWithMissingSEO) {
      for (const project of projectsWithMissingSEO) {
        const hasMeta = project.seo_title && project.seo_description;
        const hasDescription = project.short_description && project.short_description.length > 100;
        
        if (!hasMeta && !hasDescription) {
          missingMetaCount++;
          if (missingMetaExamples.length < 5) {
            missingMetaExamples.push(project.name);
          }
        }
      }
      
      if (missingMetaCount > 0) {
        warnings.push({
          type: "missing_meta",
          severity: "warning",
          message: `${missingMetaCount} projects missing SEO meta or descriptions`,
          details: `Examples: ${missingMetaExamples.join(", ")}`,
        });
      }
    }

    // ==========================================
    // 7. GENERATE SUMMARY
    // ==========================================
    const errorCount = issues.filter(i => i.severity === "error").length;
    const warningCount = issues.filter(i => i.severity === "warning").length + warnings.length;
    
    let summary = "";
    if (errorCount === 0 && warningCount === 0) {
      summary = `✅ SEO Health Check passed! Sitemap contains ${sitemapUrlCount} URLs. All ${citiesFullyIndexed} city pages indexed.`;
    } else if (errorCount === 0) {
      summary = `⚠️ SEO Health Check completed with ${warningCount} warnings. Sitemap: ${sitemapUrlCount} URLs.`;
    } else {
      summary = `❌ SEO Health Check found ${errorCount} errors and ${warningCount} warnings. Review required.`;
    }

    console.log(summary);

    // ==========================================
    // 8. UPDATE HEALTH CHECK RECORD
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
        non_indexed_analysis: nonIndexedAnalysis,
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
      cityPagesIndexed: citiesFullyIndexed,
      totalCityPages: allCities.length * 3, // hub + condos + townhomes
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
