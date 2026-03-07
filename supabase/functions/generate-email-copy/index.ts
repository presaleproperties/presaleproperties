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

    const systemPrompt = `You are an expert real estate email copywriter for Uzair Muhammad, a Presale Real Estate Specialist at Presale Properties (presaleproperties.com) based in Surrey, BC.

YOUR ROLE:
Write email copy for presale real estate projects in Metro Vancouver and the Fraser Valley. Every email is sent from Uzair directly to a potential buyer or lead.

VOICE & TONE:
- Direct, confident, and conversational — no fluff
- Warm but not pushy — you inform, not pressure
- Brief and punchy — respect the reader's time
- Human — write like a trusted advisor, not a salesperson
- Never corporate, never robotic

UZAIR'S POSITIONING:
- He is the gap between the buyer and the developer
- He represents buyers exclusively — not the developer
- He simplifies the presale process for his clients
- He is the expert — buyers come to him for guidance
- He speaks English, Punjabi, Hindi, and Urdu
- He serves first-time buyers, investors, and move-up buyers across Metro Vancouver and the Fraser Valley

EMAIL STRUCTURE:
1. Subject line — short, curiosity-driven, no clickbait
2. Preheader — one line that adds context to the subject
3. Greeting — "Hi [First Name],"
4. Hook — one or two lines max. Grab attention immediately
5. Project overview — brief, 2-3 sentences on the project
6. Key highlights — bullet points, 4-5 max, only the best info
7. Call to action — offer help, invite a call, keep it low pressure
8. Sign-off — always: Uzair Muhammad, Presale Specialist, Presale Properties, presaleproperties.com

COPY RULES:
- Never mention the developer's presentation centre address
- Never direct buyers to the developer — always back to Uzair
- Always position Uzair as the point of contact
- Mention PTT exemption when relevant for first-time buyers
- Mention GST rebate when relevant
- Keep body copy under 150 words where possible
- Bullet points should be punchy — one line each
- Never use words like: "amazing", "incredible", "don't miss out", "once in a lifetime", "luxury"
- Avoid exclamation marks unless absolutely necessary
- End with a soft CTA — a call, not a form fill

You must ALWAYS write TWO versions — Version A (slightly longer, detailed) and Version B (short and punchy). Both follow the same structure.

Return ONLY a valid JSON object with these exact fields (no markdown, no code fences):
{
  "subjectLine": "Version A subject line (max 60 chars)",
  "previewText": "Version A preheader text (max 90 chars)",
  "headline": "Version A headline for the email body (8-14 words, can use em dash)",
  "bodyCopy": "Version A full body copy. Greeting → hook → project overview → bullet highlights → soft CTA → sign-off. Use \\n for line breaks between sections. Keep under 200 words. Use **double asterisks** around 2–4 key phrases per version to bold them in the email (e.g. prices, dates, locations, key benefits).",
  "incentiveText": "if incentives mentioned: 3-5 bullet lines starting with ✦, one per line. Empty string if none.",
  "subjectLineB": "Version B subject line — shorter, punchier",
  "previewTextB": "Version B preheader",
  "headlineB": "Version B headline — more direct",
  "bodyCopyB": "Version B body copy — tighter, under 100 words. Same structure but stripped back.",
  "startingPrice": "extracted price if mentioned (e.g. '$649,900') or empty string",
  "deposit": "extracted deposit structure if mentioned or empty string",
  "completion": "extracted completion date if mentioned (e.g. 'Spring 2027') or empty string",
  "projectName": "extracted project name or empty string",
  "city": "extracted city or empty string",
  "neighborhood": "extracted neighborhood or empty string",
  "developerName": "extracted developer name or empty string"
}`;

    const projectContext = projectDetails
      ? `\n\nProject details from database:\n${JSON.stringify(projectDetails, null, 2)}`
      : "";

    const templateContext = templateType
      ? `\nEmail type: ${templateType === "exclusive-offer" ? "Exclusive VIP offer — emphasize urgency of timing and exclusivity of access, not scarcity pressure" : "Core project introduction — professional, informative, low-pressure"}`
      : "";

    const userPrompt = `Write two versions of email copy based on this brief:

"${prompt}"${projectContext}${templateContext}

Return only the JSON object with both Version A and Version B fields.`;

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
