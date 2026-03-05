import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function extractJsonFromText(text: string): Record<string, any> | null {
  // 1. Strip markdown code fences
  let cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();

  // 2. Try direct parse first
  try {
    return JSON.parse(cleaned);
  } catch (_) { /* continue */ }

  // 3. Find the first { ... } block
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch (_) { /* continue */ }
  }

  // 4. Give up
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { fileUrl, fileName } = await req.json();
    if (!fileUrl) {
      return new Response(JSON.stringify({ error: "fileUrl required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Fetch file to determine type
    let fileResp: Response;
    try {
      fileResp = await fetch(fileUrl);
    } catch (err) {
      throw new Error(`Failed to fetch floor plan file: ${err}`);
    }

    const contentType = fileResp.headers.get("content-type") || "";
    const isImage = contentType.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif)$/i.test(fileName || "");

    const systemPrompt = `You are a real estate document analyzer specializing in floor plans. 
Extract unit details from the provided floor plan document. 
ALWAYS respond with ONLY a valid JSON object — no explanation, no markdown, no preamble.
If a field is not visible or determinable, use null.`;

    const extractionPrompt = `Extract unit details from this floor plan and return ONLY a JSON object with these exact keys:
{
  "unit_number": string or null,
  "unit_type": string or null (e.g. "2 Bed + Den", "1 Bedroom"),
  "beds": number or null,
  "baths": number or null,
  "interior_sqft": number or null,
  "exterior_sqft": number or null,
  "floor_level": number or null,
  "exposure": string or null (e.g. "South", "NW", "South-West"),
  "floor_plan_name": string or null (e.g. "Plan B", "The Summit")
}
Rules:
- beds and baths must be numbers (e.g. 2, 1.5) not strings
- interior_sqft and exterior_sqft must be numbers not strings  
- floor_level must be a number not a string
- Return ONLY the JSON object, nothing else`;

    let userContent: any[];

    if (isImage) {
      const blob = await fileResp.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(blob)));
      const mimeType = (contentType.split(";")[0] || "image/jpeg").trim();
      userContent = [
        { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
        { type: "text", text: extractionPrompt },
      ];
    } else {
      // For PDFs: fetch as base64 and pass as document
      const blob = await fileResp.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(blob)));
      userContent = [
        {
          type: "text",
          text: `${extractionPrompt}\n\nThe floor plan is a PDF document. File name: "${fileName || "floor_plan.pdf"}". Base64 data available below.`,
        },
        // Gemini supports PDF via base64 inline
        {
          type: "image_url",
          image_url: { url: `data:application/pdf;base64,${base64}` },
        },
      ];
    }

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        max_tokens: 800,
        temperature: 0.1,
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      throw new Error(`AI API error: ${aiResp.status} - ${errText.slice(0, 500)}`);
    }

    const aiData = await aiResp.json();
    const rawText = aiData.choices?.[0]?.message?.content || "";

    console.log("AI raw response:", rawText.slice(0, 500));

    const extracted = extractJsonFromText(rawText);
    if (!extracted) {
      console.error("Could not parse JSON from AI response:", rawText.slice(0, 500));
      throw new Error("AI returned non-parseable response");
    }

    // Coerce types to ensure numbers are numbers
    const coerced: Record<string, any> = {
      unit_number: extracted.unit_number ? String(extracted.unit_number) : null,
      unit_type: extracted.unit_type ? String(extracted.unit_type) : null,
      beds: extracted.beds != null ? parseFloat(String(extracted.beds)) || null : null,
      baths: extracted.baths != null ? parseFloat(String(extracted.baths)) || null : null,
      interior_sqft: extracted.interior_sqft != null ? parseInt(String(extracted.interior_sqft)) || null : null,
      exterior_sqft: extracted.exterior_sqft != null ? parseInt(String(extracted.exterior_sqft)) || null : null,
      floor_level: extracted.floor_level != null ? parseInt(String(extracted.floor_level)) || null : null,
      exposure: extracted.exposure ? String(extracted.exposure) : null,
      floor_plan_name: extracted.floor_plan_name ? String(extracted.floor_plan_name) : null,
    };

    console.log("Coerced data:", JSON.stringify(coerced));

    return new Response(JSON.stringify({ success: true, data: coerced }), {
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
