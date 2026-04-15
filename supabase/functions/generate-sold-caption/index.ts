import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { userInput, projectName, agentName, unitCount } = await req.json();

    if (!userInput) {
      return new Response(JSON.stringify({ error: "userInput is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

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
            content: `You are a real estate social media copywriter specializing in "SOLD" / "JUST SOLD" celebration posts for Instagram and Facebook.

Write engaging, celebratory captions that:
- Start with a bold attention-grabbing opener (e.g. "🔑 JUST SOLD!", "✨ SOLD!", "🎉 Another One SOLD!")
- Celebrate the buyer's milestone
- Mention the project name and agent naturally
- Include relevant emojis but don't overdo it
- End with a call to action and relevant hashtags (#JustSold #Presale #RealEstate #Vancouver etc.)
- Keep it concise — ideal for Instagram/Facebook (under 300 words)
- Sound authentic and personal, not corporate

The user will give you a rough idea of what happened. Expand it into a polished, ready-to-post caption.`,
          },
          {
            role: "user",
            content: `Write a SOLD post caption based on this:

${userInput}

${projectName ? `Project: ${projectName}` : ""}
${agentName ? `Agent: ${agentName}` : ""}
${unitCount ? `Units sold: ${unitCount}` : ""}

Generate 2 different caption variations — one shorter/punchier and one more detailed/storytelling.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_sold_captions",
              description: "Return 2 sold post caption variations",
              parameters: {
                type: "object",
                properties: {
                  captions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        style: { type: "string", description: "Style name, e.g. 'Punchy' or 'Storytelling'" },
                        caption: { type: "string", description: "Full Instagram/Facebook caption ready to paste" },
                      },
                      required: ["style", "caption"],
                    },
                  },
                },
                required: ["captions"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_sold_captions" } },
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
    const result = toolCall?.function?.arguments ? JSON.parse(toolCall.function.arguments) : { captions: [] };

    return new Response(
      JSON.stringify({ success: true, captions: result.captions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in generate-sold-caption:", error);
    const message = error instanceof Error ? error.message : "Failed to generate";
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
