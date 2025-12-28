import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Project {
  id: string;
  name: string;
  gallery_images: string[] | null;
}

interface ImageAnalysis {
  url: string;
  isFloorPlan: boolean;
  confidence: number;
  reason: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get optional project_id from request body
    let projectId: string | null = null;
    try {
      const body = await req.json();
      projectId = body.project_id || null;
    } catch {
      // No body provided, process all projects
    }

    // Fetch projects with gallery images
    let query = supabase
      .from("presale_projects")
      .select("id, name, gallery_images")
      .not("gallery_images", "is", null);

    if (projectId) {
      query = query.eq("id", projectId);
    }

    const { data: projects, error: fetchError } = await query;

    if (fetchError) {
      console.error("Error fetching projects:", fetchError);
      throw new Error(`Failed to fetch projects: ${fetchError.message}`);
    }

    if (!projects || projects.length === 0) {
      return new Response(
        JSON.stringify({ message: "No projects with gallery images found", results: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${projects.length} projects...`);

    const results: { projectId: string; projectName: string; removed: string[]; kept: string[] }[] = [];

    for (const project of projects) {
      if (!project.gallery_images || project.gallery_images.length === 0) {
        continue;
      }

      console.log(`\nAnalyzing ${project.gallery_images.length} images for project: ${project.name}`);

      const imageAnalyses: ImageAnalysis[] = [];

      // Analyze each image
      for (const imageUrl of project.gallery_images) {
        try {
          console.log(`Analyzing image: ${imageUrl.substring(0, 80)}...`);

          const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text: `Analyze this image and determine if it is a floor plan or site plan.

A floor plan typically shows:
- Room layouts from a top-down view
- Walls, doors, windows
- Room dimensions or labels
- Furniture placement diagrams
- Architectural blueprints or technical drawings
- Site plans showing building footprints

NOT a floor plan:
- Exterior building photos
- Interior room photos
- Amenity photos
- Lifestyle/marketing images
- Aerial photos of actual buildings

Respond with ONLY a JSON object (no markdown, no code blocks):
{"isFloorPlan": true/false, "confidence": 0-100, "reason": "brief explanation"}`
                    },
                    {
                      type: "image_url",
                      image_url: { url: imageUrl }
                    }
                  ]
                }
              ],
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`AI API error for image: ${response.status} - ${errorText}`);
            // Default to keeping the image if we can't analyze it
            imageAnalyses.push({
              url: imageUrl,
              isFloorPlan: false,
              confidence: 0,
              reason: "Could not analyze - keeping by default"
            });
            continue;
          }

          const data = await response.json();
          const content = data.choices?.[0]?.message?.content || "";
          
          console.log(`AI response: ${content}`);

          // Parse the JSON response
          let analysis: { isFloorPlan: boolean; confidence: number; reason: string };
          try {
            // Clean up the response - remove any markdown formatting
            const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            analysis = JSON.parse(cleanContent);
          } catch (parseError) {
            console.error(`Failed to parse AI response: ${content}`);
            // Default to keeping the image
            analysis = { isFloorPlan: false, confidence: 0, reason: "Parse error - keeping by default" };
          }

          imageAnalyses.push({
            url: imageUrl,
            isFloorPlan: analysis.isFloorPlan,
            confidence: analysis.confidence,
            reason: analysis.reason
          });

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (imageError) {
          console.error(`Error analyzing image ${imageUrl}:`, imageError);
          imageAnalyses.push({
            url: imageUrl,
            isFloorPlan: false,
            confidence: 0,
            reason: "Error during analysis - keeping by default"
          });
        }
      }

      // Separate floor plans from other images
      const floorPlanImages = imageAnalyses.filter(a => a.isFloorPlan && a.confidence >= 70);
      const keptImages = imageAnalyses.filter(a => !a.isFloorPlan || a.confidence < 70);

      console.log(`\nProject ${project.name}: Removing ${floorPlanImages.length} floor plans, keeping ${keptImages.length} images`);
      
      floorPlanImages.forEach(fp => {
        console.log(`  - REMOVING: ${fp.reason} (${fp.confidence}% confidence)`);
      });

      // Update the project if any floor plans were found
      if (floorPlanImages.length > 0) {
        const newGalleryImages = keptImages.map(a => a.url);
        
        const { error: updateError } = await supabase
          .from("presale_projects")
          .update({ gallery_images: newGalleryImages.length > 0 ? newGalleryImages : null })
          .eq("id", project.id);

        if (updateError) {
          console.error(`Failed to update project ${project.name}:`, updateError);
        } else {
          console.log(`Successfully updated project ${project.name}`);
        }
      }

      results.push({
        projectId: project.id,
        projectName: project.name,
        removed: floorPlanImages.map(fp => fp.url),
        kept: keptImages.map(k => k.url)
      });
    }

    const totalRemoved = results.reduce((sum, r) => sum + r.removed.length, 0);
    const totalKept = results.reduce((sum, r) => sum + r.kept.length, 0);

    console.log(`\n=== SUMMARY ===`);
    console.log(`Projects processed: ${results.length}`);
    console.log(`Total floor plans removed: ${totalRemoved}`);
    console.log(`Total images kept: ${totalKept}`);

    return new Response(
      JSON.stringify({
        message: `Processed ${results.length} projects. Removed ${totalRemoved} floor plans, kept ${totalKept} images.`,
        results
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in remove-floorplan-images:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
