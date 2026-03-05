import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { fileUrl, fileName } = await req.json();
    if (!fileUrl) return new Response(JSON.stringify({ error: "fileUrl required" }), { status: 400, headers: corsHeaders });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Fetch the file to check if it's an image or PDF
    const fileResp = await fetch(fileUrl);
    const contentType = fileResp.headers.get("content-type") || "";
    const isImage = contentType.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif)$/i.test(fileName || "");

    let userContent: any[];

    if (isImage) {
      // For images, pass directly as vision input
      const blob = await fileResp.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(blob)));
      const mimeType = contentType.split(";")[0] || "image/jpeg";
      userContent = [
        {
          type: "image_url",
          image_url: { url: `data:${mimeType};base64,${base64}` },
        },
        {
          type: "text",
          text: `You are extracting unit details from a real estate floor plan document. 
Extract the following fields if visible and return ONLY valid JSON (no markdown, no explanation):
{
  "unit_number": string or null,
  "unit_type": string or null (e.g. "2 Bed + Den", "1 Bedroom"),
  "beds": number or null,
  "baths": number or null,
  "interior_sqft": number or null,
  "exterior_sqft": number or null (balcony/patio),
  "floor_level": number or null,
  "exposure": string or null (e.g. "South", "NW"),
  "floor_plan_name": string or null (e.g. "Plan B", "The Summit")
}
Only return numbers for numeric fields. Return null if not visible.`,
        },
      ];
    } else {
      // For PDFs or other files, just use the URL in the text prompt
      userContent = [
        {
          type: "text",
          text: `I have a floor plan file at this URL: ${fileUrl}
File name: ${fileName || "unknown"}

Based on the file name and any information you can infer, extract unit details and return ONLY valid JSON (no markdown):
{
  "unit_number": string or null,
  "unit_type": string or null,
  "beds": number or null,
  "baths": number or null,
  "interior_sqft": number or null,
  "exterior_sqft": number or null,
  "floor_level": number or null,
  "exposure": string or null,
  "floor_plan_name": string or null
}
Return null for any field you cannot determine.`,
        },
      ];
    }

    const aiResp = await fetch("https://lovable.dev/api/ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: userContent }],
        max_tokens: 500,
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      throw new Error(`AI API error: ${aiResp.status} - ${errText}`);
    }

    const aiData = await aiResp.json();
    const rawText = aiData.choices?.[0]?.message?.content || "{}";

    // Strip markdown code blocks if present
    const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const extracted = JSON.parse(cleaned);

    return new Response(JSON.stringify({ success: true, data: extracted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("extract-floor-plan error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
