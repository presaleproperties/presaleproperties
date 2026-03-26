import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://presaleproperties.com",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { mode } = await req.json(); // "descriptions" | "highlights" | "both"

    const results: string[] = [];

    // === ENRICH THIN DESCRIPTIONS ===
    if (mode === "descriptions" || mode === "both") {
      const { data: thinProjects, error } = await supabase
        .from("presale_projects")
        .select("id, name, city, neighborhood, developer_name, starting_price, deposit_structure, completion_year, completion_month, amenities, project_type, incentives, strata_fees, assignment_fees, near_skytrain, unit_mix, full_description, short_description")
        .eq("is_published", true)
        .or("full_description.is.null,full_description.lt.200");

      if (error) throw error;

      // Filter to truly thin ones
      const needsEnrichment = (thinProjects || []).filter(
        (p) => !p.full_description || p.full_description.length < 200
      );

      results.push(`Found ${needsEnrichment.length} projects needing description enrichment`);

      for (const project of needsEnrichment) {
        const typeLabel = project.project_type === "condo" ? "condos" : 
          project.project_type === "townhome" ? "townhomes" : 
          project.project_type === "single_family" ? "single-family homes" :
          project.project_type === "duplex" ? "duplexes" : "residences";

        const completionText = project.completion_year
          ? (project.completion_month
            ? `${new Date(2000, project.completion_month - 1).toLocaleString("default", { month: "long" })} ${project.completion_year}`
            : `${project.completion_year}`)
          : "TBA";

        const priceText = project.starting_price
          ? new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(project.starting_price)
          : null;

        const amenitiesList = project.amenities && project.amenities.length > 0
          ? project.amenities.join(", ")
          : null;

        // Build a rich, factual description from existing data
        const paragraphs: string[] = [];

        // Opening paragraph
        paragraphs.push(
          `${project.name} is a new presale ${typeLabel.slice(0, -1)} development by ${project.developer_name || "a reputable developer"} located in ${project.neighborhood}, ${project.city}, British Columbia.${priceText ? ` Starting from ${priceText}, this` : " This"} project offers ${project.unit_mix || typeLabel} designed for modern living in one of Metro Vancouver's most desirable neighborhoods.`
        );

        // Completion and deposit
        const depositLine = project.deposit_structure
          ? `The deposit structure is ${project.deposit_structure}, making it accessible for first-time buyers and investors alike.`
          : "Flexible deposit structures are available — contact us for details.";
        paragraphs.push(
          `${project.name} is estimated to complete in ${completionText}. ${depositLine}${project.strata_fees ? ` Estimated strata fees are approximately ${project.strata_fees} per month.` : ""}`
        );

        // Amenities paragraph
        if (amenitiesList) {
          paragraphs.push(
            `Residents will enjoy thoughtfully designed amenities including ${amenitiesList}. These features are designed to enhance daily living and foster a sense of community among homeowners.`
          );
        }

        // Location paragraph
        const transitLine = project.near_skytrain
          ? " The development benefits from proximity to SkyTrain, providing quick access to downtown Vancouver and surrounding cities."
          : project.city === "Surrey" || project.city === "Burnaby" || project.city === "Coquitlam" || project.city === "Vancouver" || project.city === "Richmond"
          ? " Major transit routes including SkyTrain are accessible from the area."
          : " The location offers convenient access to major highways and bus routes.";
        paragraphs.push(
          `${project.neighborhood} in ${project.city} is known for its growing community, local shops, parks, and schools.${transitLine} Whether you're a first-time buyer looking to enter the market or an investor seeking strong rental potential, ${project.name} presents an excellent opportunity in the ${project.city} presale market.`
        );

        // Assignment + incentives
        const extras: string[] = [];
        if (project.assignment_fees) extras.push(`Assignment policy: ${project.assignment_fees}`);
        if (project.incentives) extras.push(`Current incentives: ${project.incentives}`);
        if (extras.length > 0) {
          paragraphs.push(extras.join(". ") + `. Contact our presale specialists for VIP pricing and floor plans for ${project.name}.`);
        } else {
          paragraphs.push(`Contact our presale specialists for VIP pricing, floor plans, and exclusive incentives for ${project.name}.`);
        }

        const newDescription = paragraphs.join("\n\n");

        const { error: updateError } = await supabase
          .from("presale_projects")
          .update({ full_description: newDescription })
          .eq("id", project.id);

        if (updateError) {
          results.push(`❌ ${project.name}: ${updateError.message}`);
        } else {
          results.push(`✅ ${project.name}: enriched (${newDescription.length} chars)`);
        }
      }
    }

    // === AUTO-GENERATE HIGHLIGHTS ===
    if (mode === "highlights" || mode === "both") {
      const { data: noHighlights, error } = await supabase
        .from("presale_projects")
        .select("id, name, city, neighborhood, developer_name, starting_price, deposit_structure, completion_year, completion_month, amenities, project_type, near_skytrain, unit_mix, strata_fees, assignment_fees, incentives")
        .eq("is_published", true)
        .is("highlights", null);

      if (error) throw error;

      results.push(`Found ${(noHighlights || []).length} projects needing highlights`);

      for (const project of noHighlights || []) {
        const highlights: string[] = [];

        // Price highlight
        if (project.starting_price) {
          const price = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(project.starting_price);
          highlights.push(`Starting from ${price}`);
        }

        // Developer
        if (project.developer_name) {
          highlights.push(`By ${project.developer_name}`);
        }

        // Unit mix
        if (project.unit_mix) {
          highlights.push(`${project.unit_mix} available`);
        }

        // Completion
        if (project.completion_year) {
          const monthName = project.completion_month
            ? new Date(2000, project.completion_month - 1).toLocaleString("default", { month: "short" })
            : null;
          highlights.push(`Est. completion ${monthName ? monthName + " " : ""}${project.completion_year}`);
        }

        // Deposit
        if (project.deposit_structure) {
          highlights.push(`Deposit: ${project.deposit_structure}`);
        }

        // SkyTrain
        if (project.near_skytrain) {
          highlights.push("Near SkyTrain station");
        }

        // Location
        highlights.push(`Located in ${project.neighborhood}, ${project.city}`);

        // Top amenity
        if (project.amenities && project.amenities.length > 0) {
          highlights.push(project.amenities[0]);
        }

        // Assignment
        if (project.assignment_fees && project.assignment_fees !== "N/A" && project.assignment_fees !== "TBA") {
          highlights.push(`Assignment fee: ${project.assignment_fees}`);
        }

        // Incentives
        if (project.incentives) {
          highlights.push(`Incentives available`);
        }

        // Cap at 8 highlights
        const finalHighlights = highlights.slice(0, 8);

        const { error: updateError } = await supabase
          .from("presale_projects")
          .update({ highlights: finalHighlights })
          .eq("id", project.id);

        if (updateError) {
          results.push(`❌ ${project.name}: ${updateError.message}`);
        } else {
          results.push(`✅ ${project.name}: ${finalHighlights.length} highlights`);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
