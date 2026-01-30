import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProjectData {
  id: string;
  name: string;
  city: string;
  neighborhood: string | null;
  project_type: string;
  starting_price: number | null;
  amenities: string[] | null;
  developer_name: string | null;
  short_description: string | null;
  completion_year: number | null;
}

/**
 * Generate SEO-optimized title and description for a presale project
 */
function generateSEOMeta(project: ProjectData): { seo_title: string; seo_description: string } {
  const { name, city, neighborhood, project_type, starting_price, amenities, developer_name, completion_year } = project;
  
  const currentYear = new Date().getFullYear();
  const location = neighborhood ? `${neighborhood}, ${city}` : city;
  
  // Format price for display
  const priceStr = starting_price 
    ? starting_price >= 1000000 
      ? `from $${(starting_price / 1000000).toFixed(1)}M`
      : `from $${Math.round(starting_price / 1000)}K`
    : "";
  
  // Property type label
  const typeLabel = project_type === "townhome" ? "Townhomes" 
    : project_type === "condo" ? "Condos"
    : project_type === "single_family" ? "Homes"
    : project_type === "duplex" ? "Duplexes"
    : "Homes";
  
  // Build SEO title (max 60 chars)
  let seo_title = "";
  if (priceStr) {
    seo_title = `${name} Presale ${typeLabel} in ${city} ${priceStr} | Floor Plans`;
  } else {
    seo_title = `${name} Presale ${typeLabel} in ${city} | Pricing & Floor Plans`;
  }
  
  // Trim if too long
  if (seo_title.length > 60) {
    seo_title = `${name} ${typeLabel} ${priceStr} | ${city} Presale`;
  }
  if (seo_title.length > 60) {
    seo_title = `${name} Presale ${typeLabel} | ${city} (${currentYear})`;
  }
  
  // Build SEO description (max 160 chars)
  const amenityHighlights = amenities?.slice(0, 3).join(", ") || "";
  const developerStr = developer_name ? `by ${developer_name}` : "";
  const completionStr = completion_year ? `Est. ${completion_year}` : "";
  
  let seo_description = `Discover ${name}, a new presale ${project_type} development in ${location}`;
  
  if (priceStr) {
    seo_description += ` ${priceStr}`;
  }
  
  if (developerStr) {
    seo_description += ` ${developerStr}`;
  }
  
  seo_description += `. View pricing, floor plans & deposit structure.`;
  
  if (completionStr && seo_description.length + completionStr.length < 155) {
    seo_description += ` ${completionStr}.`;
  }
  
  // Trim if too long
  if (seo_description.length > 160) {
    seo_description = `${name} presale ${project_type}s in ${location}${priceStr ? ` ${priceStr}` : ""}. Get VIP pricing, floor plans & deposit info.`;
  }
  if (seo_description.length > 160) {
    seo_description = `New ${typeLabel.toLowerCase()} development in ${city}. See ${name} pricing, floor plans & availability.`;
  }
  
  return { seo_title, seo_description };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    const { projectId, batchMode = false, dryRun = false } = body;

    // If single project mode
    if (projectId && !batchMode) {
      const { data: project, error } = await supabase
        .from("presale_projects")
        .select("id, name, city, neighborhood, project_type, starting_price, amenities, developer_name, short_description, completion_year")
        .eq("id", projectId)
        .single();

      if (error || !project) {
        return new Response(JSON.stringify({ success: false, error: "Project not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const seoMeta = generateSEOMeta(project as ProjectData);

      if (!dryRun) {
        await supabase
          .from("presale_projects")
          .update(seoMeta)
          .eq("id", projectId);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        project: project.name,
        ...seoMeta,
        dryRun 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Batch mode - generate for all projects missing SEO
    const { data: projects, error } = await supabase
      .from("presale_projects")
      .select("id, name, city, neighborhood, project_type, starting_price, amenities, developer_name, short_description, completion_year, seo_title, seo_description")
      .eq("is_published", true)
      .or("seo_title.is.null,seo_title.eq.,seo_description.is.null,seo_description.eq.");

    if (error) {
      console.error("Error fetching projects:", error);
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: { name: string; seo_title: string; seo_description: string }[] = [];
    const errors: { name: string; error: string }[] = [];

    for (const project of projects || []) {
      try {
        const seoMeta = generateSEOMeta(project as ProjectData);
        
        if (!dryRun) {
          const { error: updateError } = await supabase
            .from("presale_projects")
            .update(seoMeta)
            .eq("id", project.id);

          if (updateError) {
            errors.push({ name: project.name, error: updateError.message });
            continue;
          }
        }

        results.push({ name: project.name, ...seoMeta });
      } catch (err) {
        errors.push({ name: project.name, error: String(err) });
      }
    }

    console.log(`✅ SEO generation complete: ${results.length} updated, ${errors.length} errors`);

    return new Response(JSON.stringify({ 
      success: true,
      totalProcessed: results.length,
      totalErrors: errors.length,
      results: results.slice(0, 20), // Return first 20 for preview
      errors: errors.slice(0, 10),
      dryRun
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("SEO generation error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
