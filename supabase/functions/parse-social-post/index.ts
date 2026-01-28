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
    const { source, description, imageBase64 } = await req.json();

    if (!description && !imageBase64) {
      return new Response(
        JSON.stringify({ success: false, error: "Please provide description text or an image" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${source} content...`);
    console.log(`Description length: ${description?.length || 0}`);
    console.log(`Has image: ${!!imageBase64}`);

    // Build the prompt for extraction
    const systemPrompt = `You are an expert real estate data extractor. Extract property assignment details from social media posts (Facebook or WhatsApp).

Return a JSON object with these fields (only include fields you can confidently extract):
- project_name: string (the development/building name)
- developer_name: string (the developer company)
- city: string (must be one of: Vancouver, Burnaby, Richmond, Surrey, Coquitlam, North Vancouver, West Vancouver, New Westminster, Port Coquitlam, Port Moody, Langley, Delta, White Rock)
- neighborhood: string (area within the city)
- address: string (full street address if available)
- property_type: "condo" | "townhouse" | "other"
- unit_type: "studio" | "1bed" | "1bed_den" | "2bed" | "2bed_den" | "3bed" | "penthouse"
- beds: number (0 for studio)
- baths: number
- interior_sqft: number
- exterior_sqft: number (balcony/patio area)
- floor_level: number
- exposure: string (N, S, E, W, NE, SE, NW, SW, or descriptive like "City Views")
- original_price: number (developer purchase price)
- assignment_price: number (current asking price)
- deposit_paid: number (amount already paid to developer)
- completion_month: number (1-12)
- completion_year: number (2024-2035)
- construction_status: "pre_construction" | "under_construction" | "completed"
- has_parking: boolean
- parking_count: number
- has_storage: boolean
- description: string (a clean, professional summary)

Parse common formats like:
- "2BR+Den" → unit_type: "2bed_den", beds: 2
- "1 Bed + Den" → unit_type: "1bed_den", beds: 1
- "$850K" or "$850,000" → 850000
- "Q4 2025" → completion_month: 10-12, completion_year: 2025
- "Oct 2025" → completion_month: 10, completion_year: 2025
- "✅" or "Included" for parking/storage → true
- "❌" or "Not included" → false

Return ONLY valid JSON, no markdown or explanation.`;

    const userContent: any[] = [];
    
    // Add image if provided
    if (imageBase64) {
      // Extract the base64 data after the data URL prefix
      const base64Data = imageBase64.includes(",") 
        ? imageBase64.split(",")[1] 
        : imageBase64;
      
      userContent.push({
        type: "image_url",
        image_url: {
          url: `data:image/jpeg;base64,${base64Data}`,
        },
      });
    }

    // Add text content
    const textPrompt = description 
      ? `Extract assignment property details from this ${source} post:\n\n${description}` 
      : `Extract assignment property details from this ${source} post image.`;
    
    userContent.push({
      type: "text",
      text: textPrompt,
    });

    // Call Lovable AI Gateway with vision capability
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        max_tokens: 1500,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", errorText);
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    console.log("AI response:", content);

    // Parse JSON from response
    let extractedData: Record<string, any>;
    try {
      // Try to extract JSON from potential markdown formatting
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || 
                        content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      extractedData = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", content);
      throw new Error("Could not parse extracted data");
    }

    // Validate and clean data
    const validatedData: Record<string, any> = {};
    
    const stringFields = ["project_name", "developer_name", "city", "neighborhood", "address", "exposure", "description"];
    const enumFields = {
      property_type: ["condo", "townhouse", "other"],
      unit_type: ["studio", "1bed", "1bed_den", "2bed", "2bed_den", "3bed", "penthouse"],
      construction_status: ["pre_construction", "under_construction", "completed"],
    };
    const numberFields = ["beds", "baths", "interior_sqft", "exterior_sqft", "floor_level", "original_price", "assignment_price", "deposit_paid", "completion_month", "completion_year", "parking_count"];
    const boolFields = ["has_parking", "has_storage"];

    stringFields.forEach(field => {
      if (extractedData[field] && typeof extractedData[field] === "string") {
        validatedData[field] = extractedData[field].trim();
      }
    });

    Object.entries(enumFields).forEach(([field, values]) => {
      if (extractedData[field] && values.includes(extractedData[field])) {
        validatedData[field] = extractedData[field];
      }
    });

    numberFields.forEach(field => {
      const val = extractedData[field];
      if (val !== undefined && val !== null) {
        const num = typeof val === "string" ? parseFloat(val.replace(/[,$]/g, "")) : val;
        if (!isNaN(num) && num >= 0) {
          validatedData[field] = Math.round(num);
        }
      }
    });

    boolFields.forEach(field => {
      if (typeof extractedData[field] === "boolean") {
        validatedData[field] = extractedData[field];
      }
    });

    console.log("Validated data:", validatedData);

    return new Response(
      JSON.stringify({ success: true, data: validatedData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in parse-social-post:", error);
    const message = error instanceof Error ? error.message : "Processing failed";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
