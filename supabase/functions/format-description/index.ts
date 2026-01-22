import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description, projectContext, isShortDescription, type, projectName, city, neighborhood } = await req.json();

    // Handle SEO generation
    if (type === 'seo') {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) {
        throw new Error("LOVABLE_API_KEY is not configured");
      }

      const seoPrompt = `You are an SEO expert for real estate presale listings. Generate optimized SEO title and meta description.

PROJECT DETAILS:
${description}

RULES:
1. SEO Title: Max 60 characters. Include project name, property type, and location. Format: "{Project Name} | {Type} in {Neighborhood}, {City}"
2. Meta Description: Max 155 characters. Include key selling points, location, and a call-to-action. Be compelling.
3. Include year 2026 if completion date is mentioned
4. Use high-intent keywords: "presale", "new construction", city name
5. Make it click-worthy but accurate

Respond in this exact JSON format:
{"seoTitle": "...", "seoDescription": "..."}`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "user", content: seoPrompt },
          ],
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI gateway error:", response.status, errorText);
        throw new Error("AI SEO generation failed");
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      try {
        // Extract JSON from response (may be wrapped in markdown)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return new Response(
            JSON.stringify(parsed),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (parseError) {
        console.error("Failed to parse SEO response:", content);
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to parse SEO content" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const minLength = isShortDescription ? 10 : 20;
    if (!description || description.trim().length < minLength) {
      return new Response(
        JSON.stringify({ error: "Description too short to format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Different prompts for short vs full descriptions
    const systemPrompt = isShortDescription 
      ? `You are a real estate copywriter who creates compelling short descriptions for property cards.

CRITICAL RULES:
1. DO NOT invent, add, or fabricate ANY information not present in the original text
2. Keep it to 1-2 sentences maximum (under 200 characters ideal)
3. Focus on the most compelling selling points
4. Make it punchy and action-oriented
5. Include location highlights if mentioned
6. No bullet points or markdown - plain text only
7. If there are numbers, prices, or dates - keep them EXACTLY as provided

OUTPUT FORMAT:
- Plain text, 1-2 sentences
- Engaging and benefit-focused
- Perfect for listing cards`
      : `You are a real estate copywriter who formats property descriptions for easy reading.

CRITICAL RULES:
1. DO NOT invent, add, or fabricate ANY information not present in the original text
2. ONLY restructure and format the existing content
3. Use **bold** for key terms (location, developer, unit types, prices, completion dates)
4. Use bullet points (•) for lists of features or amenities
5. Break long paragraphs into shorter, scannable sections
6. Keep the same facts - just make them easier to skim
7. Maximum 2-3 short paragraphs plus optional bullet list
8. If there are numbers, prices, or dates - keep them EXACTLY as provided

OUTPUT FORMAT:
- Use **bold** for emphasis (markdown)
- Use • for bullet points
- Keep it concise and professional
- No headers or titles - just formatted body text`;

    const userPrompt = isShortDescription
      ? `Rewrite this as a short, compelling 1-2 sentence description for a property card. Keep all facts but make it punchy:

${projectContext ? `Project: ${projectContext.name} in ${projectContext.neighborhood}, ${projectContext.city}\n\n` : ''}Original text:
${description}`
      : `Format this property description for easy reading. DO NOT add any new information - only restructure what's there:

${projectContext ? `Project: ${projectContext.name}\nLocation: ${projectContext.neighborhood}, ${projectContext.city}\n\n` : ''}Description to format:
${description}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits required. Please add funds to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI formatting failed");
    }

    const data = await response.json();
    const formattedDescription = data.choices?.[0]?.message?.content;

    if (!formattedDescription) {
      throw new Error("No formatted content returned");
    }

    return new Response(
      JSON.stringify({ formatted: formattedDescription.trim() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Format description error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
