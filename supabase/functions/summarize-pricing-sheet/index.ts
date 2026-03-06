import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pricingText, projectName, city } = await req.json();

    if (!pricingText?.trim()) {
      return new Response(
        JSON.stringify({ error: "No pricing text provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a premium real estate copywriter for a luxury presale brokerage.
Your job is to extract and summarize key pricing information from raw pricing sheet text into a structured email section.

Return ONLY a JSON object with these exact keys (no markdown, no extra text):
{
  "summary": "1-2 sentence premium overview of the pricing (e.g. 'Starting from $589,900+GST. Studios to 3-bedrooms available...')",
  "units": [
    { "type": "Studio / 1 Bed / 2 Bed / 3 Bed / Penthouse etc.", "sqft": "XXX–XXX sq ft", "price": "$XXX,XXX+" }
  ],
  "highlights": ["key pricing highlight line 1", "key pricing highlight line 2", "etc — max 3 lines"]
}

Rules:
- units array: only include unit types you find in the text, max 6 types
- highlights: 2–3 concise lines about deposit structure, PTT, incentives — plain text, no bullets, max 10 words each
- If data is not available for a field, omit the field or use null
- No emojis, no markdown, no HTML`;

    const userPrompt = `Project: ${projectName || "Presale Project"}${city ? ` in ${city}` : ""}

Raw pricing sheet text:
${pricingText.slice(0, 4000)}

Extract and return the pricing summary JSON:`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.3,
          max_tokens: 600,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content?.trim() || "";

    // Strip markdown code fences if present
    const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Fallback: return raw as summary
      parsed = { summary: raw, units: [], highlights: [] };
    }

    return new Response(
      JSON.stringify({ pricing: parsed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("summarize-pricing-sheet error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
