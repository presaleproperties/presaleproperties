import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { projectId } = await req.json();
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

    const { data: project, error: projErr } = await supabase
      .from("presale_projects")
      .select("name, city, neighborhood, starting_price, price_range, developer_name, highlights, short_description, incentives, completion_year, deposit_structure, deposit_percent, status")
      .eq("id", projectId)
      .single();

    if (projErr || !project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const price = project.price_range || (project.starting_price ? `From $${project.starting_price.toLocaleString()}` : "");
    const deposit = project.deposit_structure || (project.deposit_percent ? `${project.deposit_percent}% deposit` : "");
    const completion = project.completion_year ? `Completion ${project.completion_year}` : "";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: `You are a real estate social media copywriter specializing in presale condo and townhome ads in Metro Vancouver / Fraser Valley, BC Canada.

Write punchy, high-converting Facebook/Instagram ad copy. 

STYLE — headlines should be SHORT and BOLD like these real examples:
- "$70,000+ OFF"
- "5% OFF"
- "Your Family's First Home Starts With 5% Down."
- "Starting From $639,900"
- "New Condos from $399,900"

Focus on the strongest selling point: price, discount, deposit structure, or location value. Use emojis sparingly. Include relevant hashtags.`,
          },
          {
            role: "user",
            content: `Write 3 different Facebook/Instagram ad copy variations for this presale project:

Project: ${project.name}
Location: ${project.neighborhood}, ${project.city}
Developer: ${project.developer_name || "N/A"}
Price: ${price}
Deposit: ${deposit}
Completion: ${completion}
Status: ${project.status}
Highlights: ${(project.highlights || []).join(", ")}
Description: ${project.short_description || ""}
${project.incentives ? `Incentives: ${project.incentives}` : ""}

For each variation, provide different angles (e.g. price-focused, lifestyle-focused, urgency-focused).`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_copy_variations",
              description: "Return 3 ad copy variations",
              parameters: {
                type: "object",
                properties: {
                  variations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        angle: { type: "string", description: "The angle/focus of this variation (e.g. 'Price', 'Lifestyle', 'Urgency')" },
                        headline: { type: "string", description: "BIG bold text for the graphic — short, max 5 words. e.g. '$70,000+ OFF'" },
                        subline: { type: "string", description: "Secondary line. e.g. 'New Condos from $399,900 | Completion 2028'" },
                        caption: { type: "string", description: "Full Facebook post caption with emojis and hashtags, ready to paste" },
                      },
                      required: ["angle", "headline", "subline", "caption"],
                    },
                  },
                },
                required: ["variations"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_copy_variations" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI generation failed");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const result = toolCall?.function?.arguments ? JSON.parse(toolCall.function.arguments) : { variations: [] };

    return new Response(
      JSON.stringify({ success: true, variations: result.variations }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in generate-social-post:", error);
    const message = error instanceof Error ? error.message : "Failed to generate";
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
