import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://presaleproperties.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description, projectContext, isShortDescription, type, projectName, city, neighborhood, listingData, brochureContent } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Handle assignment description generation
    if (type === 'generate_assignment') {
      const savings = listingData.original_price && listingData.assignment_price
        ? listingData.original_price - listingData.assignment_price
        : null;
      const hasSavings = savings && savings > 0;
      const hasPremium = savings && savings < 0;

      const assignmentPrompt = `You are an elite real estate marketing copywriter specializing in BC presale assignment sales. Write a persuasive, buyer-focused promotional description that makes this assignment irresistible.

PROPERTY DETAILS:
- Project: ${listingData.project_name || 'Not specified'}
- Developer: ${listingData.developer_name || 'Not specified'}
- Location: ${listingData.neighborhood ? listingData.neighborhood + ', ' : ''}${listingData.city || 'Metro Vancouver'}
- Address: ${listingData.address || 'Not specified'}
- Unit Type: ${listingData.unit_type || 'Not specified'}
- Bedrooms: ${listingData.beds !== undefined ? listingData.beds : 'Not specified'}
- Bathrooms: ${listingData.baths !== undefined ? listingData.baths : 'Not specified'}
- Interior Size: ${listingData.interior_sqft ? listingData.interior_sqft + ' sqft' : 'Not specified'}
- Exterior Size: ${listingData.exterior_sqft ? listingData.exterior_sqft + ' sqft' : 'Not specified'}
- Floor Level: ${listingData.floor_level || 'Not specified'}
- Exposure/Views: ${listingData.exposure || 'Not specified'}
- Parking: ${listingData.has_parking ? (listingData.parking_count || 1) + ' stall(s)' : 'None'}
- Storage: ${listingData.has_storage ? 'Included' : 'None'}

PRICING & FINANCIALS:
- Assignment Price: ${listingData.assignment_price ? '$' + Number(listingData.assignment_price).toLocaleString() : 'Not specified'}
- Original Purchase Price: ${listingData.original_price ? '$' + Number(listingData.original_price).toLocaleString() : 'Not specified'}
${hasSavings ? `- BUYER SAVINGS: $${Math.abs(savings!).toLocaleString()} below developer price — this is a KEY selling point, highlight prominently` : ''}
${hasPremium ? `- Premium over original: $${Math.abs(savings!).toLocaleString()} — frame this positively (e.g., locked-in pricing, sold-out project, no GST on assignment portion)` : ''}
- Deposit Already Paid by Seller: ${listingData.deposit_paid ? '$' + Number(listingData.deposit_paid).toLocaleString() : 'Not specified'}
- Assignment Fee: ${listingData.assignment_fee ? '$' + Number(listingData.assignment_fee).toLocaleString() : 'Not specified'}

TIMELINE:
- Estimated Completion: ${listingData.completion_month ? ['January','February','March','April','May','June','July','August','September','October','November','December'][listingData.completion_month - 1] : ''} ${listingData.completion_year || ''}
- Construction Status: ${listingData.construction_status?.replace('_', ' ') || 'Not specified'}

${brochureContent ? `PROJECT BROCHURE/AMENITY INFORMATION:\n${brochureContent}\n` : ''}

WRITING GUIDELINES:
1. ONLY use facts provided above — do NOT invent amenities, views, or features
2. If a detail is "Not specified", skip it entirely
3. Lead with the strongest hook: savings, location, or unique selling point
4. Emphasize the VALUE PROPOSITION of this assignment:
   - If there are savings, make that the headline benefit
   - Mention the deposit already paid as a benefit (buyer steps into an existing contract)
   - Highlight that buyer avoids years of waiting if construction is underway
5. Structure: Compelling hook → Key unit features → Financial advantages → Location/project benefits → Urgent call to action
6. Use bullet points (•) for amenities or feature lists from the brochure
7. Keep it 150-250 words — punchy, scannable, and persuasive
8. End with urgency: assignment opportunities are rare and move fast
9. Tone: Professional but exciting — like a top-producing agent pitching to a serious buyer

Write the promotional description now:`;


      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "user", content: assignmentPrompt },
          ],
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: "AI credits required. Please add funds to continue." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const errorText = await response.text();
        console.error("AI gateway error:", response.status, errorText);
        throw new Error("AI generation failed");
      }

      const data = await response.json();
      const generatedDescription = data.choices?.[0]?.message?.content;

      if (!generatedDescription) {
        throw new Error("No description generated");
      }

      return new Response(
        JSON.stringify({ formatted: generatedDescription.trim() }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle SEO generation
    if (type === 'seo') {
      const seoPrompt = `You are an SEO expert for real estate presale listings. Generate optimized SEO title and meta description.

PROJECT DETAILS:
${description}

RULES:
1. SEO Title: MUST follow this exact format: "{Project Name} {Neighborhood or City} — Download Floor Plans & Pricing"
   - Use neighborhood if available, otherwise use city
   - Max 60 characters. If too long, shorten to "{Project Name} {Location} — Floor Plans & Pricing"
   - If still too long, drop location: "{Project Name} — Download Floor Plans & Pricing"
   - Use em dash (—) not pipe (|) or hyphen (-)
   - Do NOT include year, price, or property type in the title
2. Meta Description: Max 155 characters. Include key selling points, location, starting price, and a call-to-action. Be compelling.
3. Use high-intent keywords in description: "presale", "new construction", city name
4. Make description click-worthy but accurate

Respond in this exact JSON format:
{"seoTitle": "...", "seoDescription": "..."}`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "user", content: seoPrompt },
          ],
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI gateway error:", response.status, errorText);
        throw new Error("AI SEO generation failed");
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      try {
        // Extract JSON from response (may be wrapped in markdown)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return new Response(
            JSON.stringify(parsed),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (parseError) {
        console.error("Failed to parse SEO response:", content);
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to parse SEO content" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const minLength = isShortDescription ? 10 : 20;
    if (!description || description.trim().length < minLength) {
      return new Response(
        JSON.stringify({ error: "Description too short to format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Different prompts for short vs full descriptions
    const systemPrompt = isShortDescription 
      ? `You are a real estate copywriter who creates compelling short descriptions for property cards.

CRITICAL RULES:
1. DO NOT invent, add, or fabricate ANY information not present in the original text
2. Keep it to 1-2 sentences maximum (under 200 characters ideal)
3. Focus on the most compelling selling points
4. Make it punchy and action-oriented
5. Include location highlights if mentioned
6. No bullet points or markdown - plain text only
7. If there are numbers, prices, or dates - keep them EXACTLY as provided

OUTPUT FORMAT:
- Plain text, 1-2 sentences
- Engaging and benefit-focused
- Perfect for listing cards`
      : `You are a real estate copywriter who formats property descriptions for easy reading.

CRITICAL RULES:
1. DO NOT invent, add, or fabricate ANY information not present in the original text
2. ONLY restructure and format the existing content
3. Use **bold** for key terms (location, developer, unit types, prices, completion dates)
4. Use bullet points (•) for lists of features or amenities
5. Break long paragraphs into shorter, scannable sections
6. Keep the same facts - just make them easier to skim
7. Maximum 2-3 short paragraphs plus optional bullet list
8. If there are numbers, prices, or dates - keep them EXACTLY as provided

OUTPUT FORMAT:
- Use **bold** for emphasis (markdown)
- Use • for bullet points
- Keep it concise and professional
- No headers or titles - just formatted body text`;

    const userPrompt = isShortDescription
      ? `Rewrite this as a short, compelling 1-2 sentence description for a property card. Keep all facts but make it punchy:

${projectContext ? `Project: ${projectContext.name} in ${projectContext.neighborhood}, ${projectContext.city}\n\n` : ''}Original text:
${description}`
      : `Format this property description for easy reading. DO NOT add any new information - only restructure what's there:

${projectContext ? `Project: ${projectContext.name}\nLocation: ${projectContext.neighborhood}, ${projectContext.city}\n\n` : ''}Description to format:
${description}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits required. Please add funds to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI formatting failed");
    }

    const data = await response.json();
    const formattedDescription = data.choices?.[0]?.message?.content;

    if (!formattedDescription) {
      throw new Error("No formatted content returned");
    }

    return new Response(
      JSON.stringify({ formatted: formattedDescription.trim() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Format description error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
