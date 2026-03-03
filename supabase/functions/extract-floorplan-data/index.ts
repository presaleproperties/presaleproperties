import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageUrl } = await req.json();
    if (!imageUrl) return new Response(JSON.stringify({ error: "imageUrl required" }), { status: 400, headers: corsHeaders });

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not set");

    const prompt = `You are analyzing a real estate floor plan image. Extract the following information and return ONLY a valid JSON object with these exact keys:
- planName: the plan name or label (e.g. "Plan A", "Unit 1B", "The Maple") — look for bold labels or unit identifiers
- unitType: bedroom/bathroom description (e.g. "1 Bed + Den", "2 Bed 2 Bath", "Studio")
- interiorSqft: interior square footage as a number only (no units), null if not found
- balconySqft: balcony/patio/outdoor square footage as a number only (no units), null if not found

Return ONLY the JSON object, nothing else. Example: {"planName":"Plan A","unitType":"1 Bed 1 Bath","interiorSqft":612,"balconySqft":80}`;

    const response = await fetch("https://api.lovable.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`AI API error: ${err}`);
    }

    const aiResult = await response.json();
    const raw = aiResult.choices?.[0]?.message?.content || "{}";
    
    // Strip markdown code fences if present
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const extracted = JSON.parse(cleaned);

    return new Response(JSON.stringify(extracted), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
