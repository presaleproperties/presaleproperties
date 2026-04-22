/**
 * email-ai-assist
 * ─────────────────────────────────────────────────────────────────────────
 * Lightweight AI helper for the LeadComposeDialog. Two modes:
 *
 *   action: "rewrite"
 *     body  → string  (current draft body, plain text or HTML)
 *     tone  → "shorter" | "friendlier" | "professional" | "punchier"
 *     returns { result: string }   (HTML-safe paragraph(s))
 *
 *   action: "subjects"
 *     body  → string  (current draft body)
 *     returns { suggestions: string[] }   (3-5 short subject lines)
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You help a real-estate sales rep write better one-to-one buyer emails.
The reps work at Presale Properties (Metro Vancouver, BC).
Voice: warm, direct, confident, never pushy. Short sentences. No marketing jargon.
Always preserve the merge tags {firstName}, {name}, {email} exactly if they appear.
Never invent prices, dates, or facts that weren't in the original draft.`;

function stripHtml(s: string): string {
  return s.replace(/<\/?[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, body, tone } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const cleanBody = stripHtml(String(body || "")).slice(0, 4000);
    if (!cleanBody) {
      return new Response(JSON.stringify({ error: "Empty draft" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let payload: any;

    if (action === "subjects") {
      payload = {
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Suggest 5 subject lines for this email draft. Each must be under 60 characters, no emojis at the start, no clickbait, no ALL CAPS. Avoid repeating the same opening word.\n\n---DRAFT---\n${cleanBody}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_subjects",
              description: "Return 5 short subject line suggestions",
              parameters: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: { type: "string" },
                    minItems: 3,
                    maxItems: 5,
                  },
                },
                required: ["suggestions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_subjects" } },
      };
    } else if (action === "rewrite") {
      const toneInstr: Record<string, string> = {
        shorter: "Cut the length by ~40%. Same intent, fewer words. Keep at most 2 short paragraphs.",
        friendlier: "Make it warmer and more conversational. Add a small empathetic touch but stay concise.",
        professional: "Make it more polished and professional while staying human and brief.",
        punchier: "Make it punchier and more direct. Strong opening sentence. Cut filler words.",
      };
      const instruction = toneInstr[tone] || toneInstr.shorter;
      payload = {
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Rewrite this email body. ${instruction}\nReturn ONLY the rewritten body as 1-3 short paragraphs separated by blank lines. No subject line, no greeting "Hi X" (the system already adds it), no signature.\n\n---DRAFT---\n${cleanBody}`,
          },
        ],
      };
    } else {
      return new Response(JSON.stringify({ error: "Unknown action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (resp.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit reached, try again in a moment." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (resp.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Settings → Workspace → Usage." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!resp.ok) {
      const t = await resp.text();
      console.error("ai gateway error", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();

    if (action === "subjects") {
      const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      let suggestions: string[] = [];
      try {
        suggestions = JSON.parse(args || "{}").suggestions || [];
      } catch { /* noop */ }
      // Final filter: trim, dedupe, length cap
      suggestions = Array.from(
        new Set(
          suggestions
            .map((s) => String(s || "").trim().replace(/^["']|["']$/g, ""))
            .filter((s) => s.length > 0 && s.length <= 80),
        ),
      ).slice(0, 5);
      return new Response(JSON.stringify({ suggestions }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // rewrite
    const text = data?.choices?.[0]?.message?.content?.trim() || "";
    return new Response(JSON.stringify({ result: text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("email-ai-assist error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
