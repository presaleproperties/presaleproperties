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
    const { bodyCopy, headline } = await req.json();

    if (!bodyCopy?.trim() && !headline?.trim()) {
      return new Response(
        JSON.stringify({ error: "No copy provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a real estate email copy editor. Your ONLY job is to add **double asterisk bold markers** around 3-6 high-impact keywords or short phrases in the provided copy.

STRICT RULES:
- Do NOT change, rewrite, add, or remove ANY words from the copy
- Only wrap existing words/phrases with **double asterisks**
- Bold: prices, dates, locations, project names, key numbers (%, sq ft, bedrooms), strong action phrases
- Do NOT bold: generic filler words, prepositions, articles
- Do NOT add exclamation marks or change punctuation
- Do NOT add a greeting or sign-off if one is not already there
- Return the EXACT same text with only the ** markers added — nothing else

Return a JSON object with this exact shape:
{
  "headline": "<headline with ** markers, or empty string if none provided>",
  "bodyCopy": "<body copy with ** markers added>"
}`;

    const userPrompt = `Add bold markers to these keywords only. Do NOT change any words.

HEADLINE:
${headline || ""}

BODY COPY:
${bodyCopy || ""}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
        temperature: 0.1,
        max_tokens: 1200,
      }),
    });

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
    const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse bold response:", cleaned);
      return new Response(
        JSON.stringify({ error: "AI returned malformed response. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ bodyCopy: parsed.bodyCopy || bodyCopy, headline: parsed.headline || headline }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("bold-email-keywords error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
