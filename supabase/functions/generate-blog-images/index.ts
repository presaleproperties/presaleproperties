import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
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

    const { blogIds } = await req.json();

    // Fetch blog posts
    let query = supabase.from("blog_posts").select("id, title, slug, category");
    if (blogIds && blogIds.length > 0) {
      query = query.in("id", blogIds);
    }
    
    const { data: blogs, error: fetchError } = await query;
    if (fetchError) throw fetchError;

    console.log(`Processing ${blogs?.length || 0} blog posts`);

    const results = [];

    for (const blog of blogs || []) {
      try {
        console.log(`Generating image for: ${blog.title}`);

        // Create a prompt based on the blog title
        const prompt = createImagePrompt(blog.title, blog.category);

        // Generate image using Lovable AI
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image-preview",
            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],
            modalities: ["image", "text"],
          }),
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error(`AI generation failed for ${blog.slug}: ${errorText}`);
          results.push({ id: blog.id, slug: blog.slug, success: false, error: errorText });
          continue;
        }

        const aiData = await aiResponse.json();
        const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (!imageData) {
          console.error(`No image generated for ${blog.slug}`);
          results.push({ id: blog.id, slug: blog.slug, success: false, error: "No image in response" });
          continue;
        }

        // Extract base64 data
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
        const imageBuffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

        // Upload to Supabase Storage
        const fileName = `blogs/${Date.now()}-${blog.slug}.png`;
        const { error: uploadError } = await supabase.storage
          .from("listing-photos")
          .upload(fileName, imageBuffer, {
            contentType: "image/png",
            upsert: true,
          });

        if (uploadError) {
          console.error(`Upload failed for ${blog.slug}:`, uploadError);
          results.push({ id: blog.id, slug: blog.slug, success: false, error: uploadError.message });
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("listing-photos")
          .getPublicUrl(fileName);

        // Update blog post with new image
        const { error: updateError } = await supabase
          .from("blog_posts")
          .update({ featured_image: urlData.publicUrl })
          .eq("id", blog.id);

        if (updateError) {
          console.error(`Update failed for ${blog.slug}:`, updateError);
          results.push({ id: blog.id, slug: blog.slug, success: false, error: updateError.message });
          continue;
        }

        console.log(`Successfully updated image for: ${blog.slug}`);
        results.push({ id: blog.id, slug: blog.slug, success: true, imageUrl: urlData.publicUrl });

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (blogError) {
        console.error(`Error processing ${blog.slug}:`, blogError);
        results.push({ id: blog.id, slug: blog.slug, success: false, error: String(blogError) });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-blog-images:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function createImagePrompt(title: string, category: string | null): string {
  // Create a compelling image prompt based on blog title
  const baseContext = "Professional real estate blog featured image for Vancouver/Fraser Valley market.";
  
  // Extract key themes from title
  const themes: string[] = [];
  
  if (title.toLowerCase().includes("presale") || title.toLowerCase().includes("pre-sale")) {
    themes.push("modern presale condo development");
  }
  if (title.toLowerCase().includes("vancouver")) {
    themes.push("Vancouver city skyline");
  }
  if (title.toLowerCase().includes("fraser valley") || title.toLowerCase().includes("surrey")) {
    themes.push("suburban development with mountains in background");
  }
  if (title.toLowerCase().includes("invest")) {
    themes.push("professional investment concept");
  }
  if (title.toLowerCase().includes("condo")) {
    themes.push("luxury condominium building");
  }
  if (title.toLowerCase().includes("floor plan")) {
    themes.push("architectural floor plan overlay");
  }
  if (title.toLowerCase().includes("assignment")) {
    themes.push("real estate contract signing concept");
  }
  
  const themeText = themes.length > 0 ? themes.join(", ") : "modern real estate development";
  
  return `Generate a professional, high-quality 16:9 aspect ratio blog featured image. ${baseContext} 
  
Theme: ${themeText}
Blog Title: "${title}"

Style: Clean, modern, professional real estate photography style. Bright, optimistic lighting. No text overlay needed. Photorealistic quality. Focus on architecture and lifestyle. Ultra high resolution.`;
}
