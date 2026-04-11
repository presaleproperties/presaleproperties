import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { projectId, format } = await req.json();
    if (!projectId) {
      return new Response(JSON.stringify({ error: "projectId is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch project
    const { data: project, error: projErr } = await supabase
      .from("presale_projects")
      .select("name, city, neighborhood, starting_price, price_range, featured_image, gallery_images, developer_name, highlights, short_description")
      .eq("id", projectId)
      .single();

    if (projErr || !project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const heroImage = project.featured_image || (project.gallery_images as string[])?.[0];
    if (!heroImage) {
      return new Response(JSON.stringify({ error: "Project has no images" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const price = project.price_range || (project.starting_price ? `From $${project.starting_price.toLocaleString()}` : "");
    const formatLabel = format === "story" ? "Facebook/Instagram Story (9:16 portrait)" : "Facebook Post (landscape 16:9)";
    const aspectRatio = format === "story" ? "9:16" : "16:9";

    // Step 1: Generate copy
    console.log("Generating copy for", project.name);
    const copyResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a real estate social media copywriter specializing in presale condo and townhome ads. Write punchy, high-converting Facebook ad copy.

STYLE REFERENCE — headlines should be SHORT and BOLD like these real examples:
- "$70,000+ OFF"  
- "5% OFF"
- "Your Family's First Home Starts With 5% Down."
- "Starting From $639,900"

Focus on the strongest selling point: price, discount, deposit structure, or location value.`,
          },
          {
            role: "user",
            content: `Write a Facebook post for this presale project:
Project: ${project.name}
Location: ${project.neighborhood}, ${project.city}
Developer: ${project.developer_name || "N/A"}
Price: ${price}
Highlights: ${(project.highlights || []).join(", ")}
Description: ${project.short_description || ""}
${project.incentives ? `Incentives: ${project.incentives}` : ""}

Return the copy text ready to paste into Facebook. The headline for the graphic should be the BIGGEST selling point (discount, price, deposit) — short and punchy like "$70,000+ OFF" or "From $399,900".`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_copy",
              description: "Return the generated social media copy",
              parameters: {
                type: "object",
                properties: {
                  caption: { type: "string", description: "The full Facebook post caption text with emojis and hashtags, ready to paste" },
                  headline: { type: "string", description: "The BIG bold text for the graphic — short and punchy, max 5 words. Examples: '$70,000+ OFF', 'From $399,900', '5% Down'" },
                  subline: { type: "string", description: "Secondary line below headline. Examples: 'New Condos from $399,900', 'Brand New Townhomes | Move In 2026'" },
                  cta: { type: "string", description: "Call to action text for a button. Examples: 'Floor Plans & Pricing', 'Register Now', 'Next 10 Units'" },
                },
                required: ["caption", "headline", "subline", "cta"],
              },
            },
          },
                },
                required: ["caption", "headline", "cta"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_copy" } },
      }),
    });

    if (!copyResponse.ok) {
      const errText = await copyResponse.text();
      console.error("Copy generation error:", copyResponse.status, errText);
      if (copyResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (copyResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Copy generation failed");
    }

    const copyData = await copyResponse.json();
    const copyToolCall = copyData.choices?.[0]?.message?.tool_calls?.[0];
    const copy = copyToolCall?.function?.arguments
      ? JSON.parse(copyToolCall.function.arguments)
      : { caption: "", headline: project.name, cta: "Register Now" };

    console.log("Copy generated, now generating graphic...");

    // Step 2: Generate graphic with text overlay on real project image
    const incentive = project.highlights?.find((h: string) => /off|discount|incentive|bonus|free/i.test(h)) || "";
    
    const overlayPrompt = `Edit this real estate project photo to create a professional social media ad graphic (${formatLabel}).

EXACT STYLE TO FOLLOW — this is a premium real estate ad:

1. KEEP the original photo as the main background — do NOT regenerate or alter the building/property image. Only add overlays and text ON TOP of the existing photo.

2. Add a SOLID warm orange/amber colored bar at the bottom portion of the image (roughly bottom 25-30% for post, bottom 20% for story). The bar should be opaque, not transparent.

3. On the orange bar, add LARGE BOLD WHITE TEXT showing the key offer:
   - Main headline: "${copy.headline}" — make this HUGE, bold, impactful
   - Sub-line: "From ${price}" and completion info if available
   - Small CTA text: "${copy.cta}" with a small download/arrow icon

4. Above the orange bar, on the photo itself, add a small clean white rectangular badge with dark text showing: "${project.neighborhood}, ${project.city}"

5. Keep the top portion of the photo CLEAN — no text or overlays there except optionally a small logo mark in the top-left corner

6. Typography should be BOLD, condensed, modern sans-serif. The price/offer text should be the largest element.
7. Everything must be crisp, legible, professional — like a Facebook real estate ad from a major developer
8. Do NOT add any watermarks or AI-related text`;

    const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: overlayPrompt },
              { type: "image_url", image_url: { url: heroImage } },
            ],
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!imageResponse.ok) {
      const errText = await imageResponse.text();
      console.error("Image generation error:", imageResponse.status, errText);
      if (imageResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (imageResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Image generation failed");
    }

    const imageData = await imageResponse.json();
    const generatedImage = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!generatedImage) {
      console.error("No image returned from AI");
      throw new Error("No image generated");
    }

    // Upload to storage
    const fileName = `social-posts/${projectId}/${format}-${Date.now()}.png`;
    
    // Decode base64 and upload
    const base64Data = generatedImage.replace(/^data:image\/\w+;base64,/, "");
    const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    const { error: uploadErr } = await supabase.storage
      .from("social-posts")
      .upload(fileName, imageBytes, { contentType: "image/png", upsert: true });

    let imageUrl = generatedImage; // fallback to base64
    if (!uploadErr) {
      const { data: publicUrl } = supabase.storage.from("social-posts").getPublicUrl(fileName);
      imageUrl = publicUrl.publicUrl;
    } else {
      console.warn("Upload failed, returning base64:", uploadErr.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        copy,
        imageUrl,
        format,
        project: { name: project.name, city: project.city, neighborhood: project.neighborhood },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in generate-social-post:", error);
    const message = error instanceof Error ? error.message : "Failed to generate social post";
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
