import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 8192;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    for (let j = 0; j < chunk.length; j++) {
      binary += String.fromCharCode(chunk[j]);
    }
  }
  return btoa(binary);
}

function extractJson(text: string): Record<string, any> | null {
  const cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
  try { return JSON.parse(cleaned); } catch (_) {}
  const s = cleaned.indexOf("{"); const e = cleaned.lastIndexOf("}");
  if (s !== -1 && e > s) { try { return JSON.parse(cleaned.slice(s, e + 1)); } catch (_) {} }
  return null;
}

/** BC rental estimates per sqft/month (rough CMHC-based) */
function estimateRental(unitType: string, sqft: number | null): { min: number; max: number } | null {
  const area = sqft || 0;
  if (area < 100) return null;
  const typeLower = (unitType || "").toLowerCase();

  let baseMin: number, baseMax: number;
  if (typeLower.includes("studio") || typeLower.includes("bachelor")) {
    baseMin = 1500; baseMax = 2000;
  } else if (typeLower.includes("1 bed") || typeLower.includes("1-bed") || typeLower.includes("one bed")) {
    baseMin = 2000; baseMax = 2600;
  } else if (typeLower.includes("2 bed") || typeLower.includes("2-bed") || typeLower.includes("two bed")) {
    baseMin = 2600; baseMax = 3400;
  } else if (typeLower.includes("3 bed") || typeLower.includes("three bed")) {
    baseMin = 3200; baseMax = 4200;
  } else if (typeLower.includes("townhouse") || typeLower.includes("town")) {
    baseMin = 3500; baseMax = 4800;
  } else {
    // Fallback: estimate by sqft
    const rate = area < 500 ? 3.8 : area < 700 ? 3.5 : area < 900 ? 3.2 : 2.9;
    baseMin = Math.round((area * rate * 0.9) / 50) * 50;
    baseMax = Math.round((area * rate * 1.1) / 50) * 50;
  }
  return { min: baseMin, max: baseMax };
}

/** Cap rate estimate based on price and rental */
function estimateCapRate(price: number | null, rentalMin: number, rentalMax: number): { min: number; max: number } | null {
  if (!price || price < 100000) return null;
  const annualMin = rentalMin * 12 * 0.85; // ~85% NOI factor (opex)
  const annualMax = rentalMax * 12 * 0.85;
  return {
    min: Math.round((annualMin / price) * 1000) / 10,
    max: Math.round((annualMax / price) * 1000) / 10,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { fileUrl, fileName, price } = await req.json();
    if (!fileUrl) {
      return new Response(JSON.stringify({ error: "fileUrl required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Fetch the file
    const fileResp = await fetch(fileUrl);
    if (!fileResp.ok) throw new Error(`Failed to fetch file: ${fileResp.status}`);

    const contentType = fileResp.headers.get("content-type") || "";
    const isImage = contentType.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif)$/i.test(fileName || "");

    const extractionPrompt = `You are a real estate floor plan analyst. Analyze this floor plan and return ONLY a JSON object with these exact keys:
{
  "plan_name": string or null,
  "unit_type": string or null (e.g. "1 Bed", "2 Bed + Den", "Studio"),
  "beds": number or null,
  "baths": number or null,
  "interior_sqft": number or null (interior area only, as integer),
  "exterior_sqft": number or null (balcony/patio area, as integer),
  "exposure": string or null (e.g. "South", "NW"),
  "features": array of strings (notable features like "walk-in closet", "den", "balcony", "parking")
}
Return ONLY the JSON, no explanation.`;

    const blob = await fileResp.arrayBuffer();
    const base64 = arrayBufferToBase64(blob);
    const mimeType = (contentType.split(";")[0] || "image/jpeg").trim();

    let userContent: any[];
    if (isImage) {
      userContent = [
        { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
        { type: "text", text: extractionPrompt },
      ];
    } else {
      userContent = [
        { type: "text", text: `${extractionPrompt}\n\nFile: "${fileName || "floor_plan.pdf"}"` },
        { type: "image_url", image_url: { url: `data:application/pdf;base64,${base64}` } },
      ];
    }

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: userContent }],
        max_tokens: 600,
        temperature: 0.1,
      }),
    });

    if (!aiResp.ok) throw new Error(`AI error: ${aiResp.status}`);
    const aiData = await aiResp.json();
    const rawText = aiData.choices?.[0]?.message?.content || "";
    const extracted = extractJson(rawText);

    if (!extracted) throw new Error("AI returned non-parseable response");

    const unitData = {
      plan_name: extracted.plan_name ? String(extracted.plan_name) : null,
      unit_type: extracted.unit_type ? String(extracted.unit_type) : null,
      beds: extracted.beds != null ? parseFloat(String(extracted.beds)) || null : null,
      baths: extracted.baths != null ? parseFloat(String(extracted.baths)) || null : null,
      interior_sqft: extracted.interior_sqft != null ? parseInt(String(extracted.interior_sqft)) || null : null,
      exterior_sqft: extracted.exterior_sqft != null ? parseInt(String(extracted.exterior_sqft)) || null : null,
      exposure: extracted.exposure ? String(extracted.exposure) : null,
      features: Array.isArray(extracted.features) ? extracted.features.map(String) : [],
    };

    // Generate investment projections from extracted data
    const rental = estimateRental(unitData.unit_type || "", unitData.interior_sqft);
    const priceNum = price ? parseFloat(String(price).replace(/[^0-9.]/g, "")) : null;
    const capRate = rental ? estimateCapRate(priceNum, rental.min, rental.max) : null;

    const projections = rental ? {
      rental_min: rental.min,
      rental_max: rental.max,
      cap_rate_min: capRate?.min ?? null,
      cap_rate_max: capRate?.max ?? null,
      appreciation: [4, 5, 5.5, 6, 6.5],
      price_used: priceNum,
    } : null;

    return new Response(JSON.stringify({ success: true, unit: unitData, projections }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("analyze-deck-floorplan error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
