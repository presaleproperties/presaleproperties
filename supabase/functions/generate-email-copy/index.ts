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
    const { prompt, projectDetails, templateType } = await req.json();

    if (!prompt?.trim()) {
      return new Response(
        JSON.stringify({ error: "No prompt provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an elite real estate email copywriter for Presale Properties, a luxury BC presale brokerage. 
You write warm, consultative emails that position the agent as an independent advisor — not a developer rep.
Tone: professional, direct, aspirational. No fluff, no emojis. No "Hi [FNAME]" greetings.
You always write from the perspective of a buyer's agent who deeply understands the market.

Return ONLY a valid JSON object with these exact fields (no markdown, no code fences):
{
  "subjectLine": "compelling email subject line (max 60 chars, use emoji sparingly)",
  "previewText": "email preview text that complements subject (max 90 chars)",
  "headline": "powerful headline for the email body (8-14 words, can be stylized with em dash)",
  "bodyCopy": "3-5 sentences of body copy. Warm but action-oriented. End with a soft CTA to call or book. Plain text, NO line breaks.",
  "incentiveText": "if incentives mentioned: 2-4 bullet lines starting with ✦, one per line. If no incentives, return empty string.",
  "startingPrice": "extracted price if mentioned (e.g. '$699,900') or empty string",
  "deposit": "extracted deposit if mentioned (e.g. '5%' or '$50K') or empty string",
  "completion": "extracted completion if mentioned (e.g. 'Spring 2027') or empty string",
  "projectName": "extracted project name or empty string",
  "city": "extracted city or empty string",
  "neighborhood": "extracted neighborhood or empty string",
  "developerName": "extracted developer name or empty string"
}`;

    const projectContext = projectDetails
      ? `\n\nProject details provided:\n${JSON.stringify(projectDetails, null, 2)}`
      : "";

    const templateContext = templateType
      ? `\nTemplate style: ${templateType === "exclusive-offer" ? "High-urgency exclusive offer with incentive focus" : "Core project introduction with professional tone"}`
      : "";

    const userPrompt = `Write email copy for the following brief:

"${prompt}"${projectContext}${templateContext}

Generate the email copy now. Return only the JSON object.`;

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
        temperature: 0.75,
        max_tokens: 800,
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

    // Strip markdown code fences if present
    const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", cleaned);
      return new Response(
        JSON.stringify({ error: "AI returned malformed response. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ copy: parsed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-email-copy error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
