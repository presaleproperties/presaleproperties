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
    const { prompt, projectDetails, templateType, tone } = await req.json();

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
Write email copy for presale real estate projects in Metro Vancouver and the Fraser Valley. Every email is sent from Uzair directly to a potential buyer, lead, or realtor.

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

─── CRITICAL: BODY COPY STRUCTURE ───
Every bodyCopy MUST follow this exact 5-part visual layout (separated by double line breaks \\n\\n):

PART 1 — OPENING PARAGRAPH
"Hi {$name},\\n\\n" followed by 2-4 sentences introducing the opportunity. Use **double asterisks** to bold 2-3 key phrases (project name, key selling point, urgency phrase). This should hook the reader and set context.

PART 2 — PRICING CALLOUT (on its own line, bold)
A single standout line with the price or key offer, e.g.:
"**Final Phase Starting from $789,900 + GST**"
This line should feel like a headline within the body — punchy, bold, and attention-grabbing. Always include the price if available.

PART 3 — SUPPORTING PARAGRAPH
2-3 sentences expanding on the opportunity. Bold 2-3 key phrases (unit types, location highlights, timing). This adds depth to the pitch without repeating Part 1.

PART 4 — CTA HEADLINE (on its own line, bold)
A single bold action-oriented line that creates urgency, e.g.:
"**Display Homes Open This Saturday at Noon!**"
or "**Book Your Private Tour This Week**"
This should feel like a sub-headline that drives action.

PART 5 — CLOSING LINE
One short, warm sentence (no name sign-off — the agent card handles that), e.g.:
"We can't wait to see you this weekend!" or "Let me know if you'd like to book a private viewing."

EXAMPLE bodyCopy (follow this exact rhythm):
"Hi {$name},\\n\\nWe're excited to welcome you and your clients back to **The Loop this weekend** to discover our **Final Phase of homes!** This release marks the last opportunity to own in South Surrey's most sought-after neighbourhood, with premium homes offering **exceptional value in an established community.**\\n\\n**Final Phase Starting from $789,900 + GST**\\n\\nThis final phase features our most anticipated **park-facing homes** directly overlooking Edgewood Park. If your clients have been waiting to join this community, this is the perfect moment. **Visit us this weekend** to tour our newest collection of thoughtfully designed **2, 3 and 4 bedroom homes** at The Loop.\\n\\n**Display Homes Open This Saturday at Noon!**\\n\\nWe can't wait to see you this weekend!"

─── END BODY COPY STRUCTURE ───

EMAIL STRUCTURE (full email):
1. Subject line — short, curiosity-driven, no clickbait (max 60 chars)
2. Preheader — one line that adds context to the subject (max 90 chars)
3. Headline — 4-8 words, emotional or intriguing (this is the big title above the body)
4. Body copy — MUST follow the 5-part structure above
5. Incentive text — if incentives mentioned, 3-5 bullet lines starting with ✦

COPY RULES:
- Never mention the developer's presentation centre address
- Never direct buyers to the developer — always back to Uzair
- Always position Uzair as the point of contact
- Mention PTT exemption when relevant for first-time buyers
- Mention GST rebate when relevant
- Body copy should be 120-200 words for Version A, 80-120 for Version B
- Never use words like: "amazing", "incredible", "don't miss out", "once in a lifetime", "luxury"
- Avoid exclamation marks unless it's the CTA headline
- Use **double asterisks** for bolding — 6-10 bolded phrases per version across all 5 parts

You must ALWAYS write TWO versions — Version A (slightly longer, detailed) and Version B (short and punchy). Both MUST follow the 5-part body structure.

Return ONLY a valid JSON object with these exact fields (no markdown, no code fences):
{
  "subjectLine": "Version A subject line (max 60 chars)",
  "previewText": "Version A preheader text (max 90 chars)",
  "headline": "Version A headline — short, emotional, 4-8 words (e.g. 'The Moment is Here')",
  "bodyCopy": "Version A body copy following the 5-part structure. Use \\n\\n between parts. Use **bold** on key phrases. No name sign-off.",
  "incentiveText": "if incentives mentioned: 3-5 bullet lines starting with ✦, one per line. Empty string if none.",
  "subjectLineB": "Version B subject line — shorter, punchier",
  "previewTextB": "Version B preheader",
  "headlineB": "Version B headline — more direct, 3-6 words",
  "bodyCopyB": "Version B body copy — same 5-part structure but tighter. Use **bold** on key phrases. No name sign-off.",
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
      ? `\nEmail type: ${
          templateType === "exclusive-offer"
            ? "Exclusive VIP offer — emphasize urgency and exclusivity. MUST use the 5-part body structure with a bold pricing callout and bold CTA headline."
            : templateType === "project-intro"
            ? "Project intro email — MUST use the 5-part body structure: (1) opening paragraph with bold highlights, (2) bold pricing callout line, (3) supporting paragraph with bold details, (4) bold CTA headline, (5) warm one-line close."
            : "Core project introduction — MUST use the 5-part body structure with bold highlights, pricing callout, and CTA headline."
        }`
      : "";

    const TONE_MAP: Record<string, string> = {
      confident: "Direct and confident — you know the market and guide the reader with authority.",
      urgent: "Create urgency — limited time, limited units, act now. Punchy and time-sensitive.",
      warm: "Warm and friendly — like a trusted friend sharing an exciting opportunity. Approachable and personal.",
      exclusive: "Exclusive and VIP — make the reader feel they're getting insider access. Sophisticated and premium.",
      informational: "Informational and educational — focus on facts, data, and value proposition. Less emotional, more analytical.",
    };
    const toneContext = tone && TONE_MAP[tone]
      ? `\nTone: ${TONE_MAP[tone]}`
      : "";

    const userPrompt = `Write two versions of email copy based on this brief:

"${prompt}"${projectContext}${templateContext}${toneContext}

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
