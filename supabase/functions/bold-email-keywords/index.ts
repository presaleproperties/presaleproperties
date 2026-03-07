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

    const systemPrompt = `You are an expert email copy formatter for a real estate presale company. Your job is to take raw email body copy and make it visually clean, easy to skim, and impactful — while preserving 100% of the original wording and meaning.

FORMATTING RULES:
1. **Preserve every word exactly** — do NOT add, remove, or rephrase anything
2. **Paragraph spacing** — separate logical ideas into their own short paragraphs (1-3 sentences max). Add a blank line between them (\\n\\n).
3. **Bold markers** — wrap 3-8 high-impact words/phrases with **double asterisks**. Target: prices, dates, project names, locations, key numbers (%, sqft, bedrooms), strong action phrases, urgency words
4. **Do NOT bold**: filler words, prepositions, articles, generic phrases
5. **Short lines** — if a single sentence is very long, it can stand alone as its own paragraph
6. **Bullet lines** — if the copy already has bullet/list lines (starting with -, •, ✦), keep them as separate lines (\\n between each)
7. **Salutation & sign-off** — keep the greeting and sign-off on their own separate lines
8. **Do NOT add exclamation marks, emojis, or any punctuation not already present**
9. **Do NOT add new sentences, context, or ideas**

Return a JSON object with this exact shape:
{
  "headline": "<headline with ** markers if provided, or empty string>",
  "bodyCopy": "<fully formatted body copy with \\n for line breaks and ** bold markers>"
}`;

    const userPrompt = `Format this email copy. Preserve every word exactly — only fix spacing, paragraph breaks, and add bold markers to key phrases.

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
        temperature: 0.15,
        max_tokens: 1800,
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
      console.error("Failed to parse format response:", cleaned);
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
    console.error("format-email-copy error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
