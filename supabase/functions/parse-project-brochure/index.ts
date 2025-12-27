import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentText, documentType } = await req.json();

    if (!documentText) {
      return new Response(
        JSON.stringify({ error: 'Document text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Parsing project brochure, text length:', documentText.length);

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `You are a real estate project data extraction assistant. Extract project information from the provided brochure or information sheet text and return it as structured JSON.

Extract the following fields if present (leave empty string or empty array if not found):
- name: Project name
- developer_name: Developer/builder name
- city: City location
- neighborhood: Neighborhood/area name
- address: Full address if available
- project_type: One of "condo", "townhome", or "mixed"
- unit_mix: Description of unit types (e.g., "1-3 bedroom units", "Studios to 3 bedrooms")
- starting_price: Lowest starting price as a number (e.g., 629900 for $629,900)
- price_range: Price range as text (e.g., "$629,900 - $1,200,000")
- deposit_structure: Deposit requirements (e.g., "5% on signing, 5% in 90 days")
- incentives: Any buyer incentives or promotions
- completion_month: Expected completion month (1-12)
- completion_year: Expected completion year (e.g., 2026)
- occupancy_estimate: Occupancy timeline description
- short_description: A compelling 1-2 sentence marketing summary (max 200 chars)
- full_description: Detailed project description (2-4 paragraphs)
- highlights: Array of key selling points/features (5-10 items)
- amenities: Array of amenities (e.g., ["Gym", "Rooftop Deck", "Concierge"])
- faq: Array of objects with question and answer fields for common questions

Return ONLY valid JSON with these fields. Do not include any markdown formatting or explanation.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Extract project data from this ${documentType || 'brochure'}:\n\n${documentText}` }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to process document with AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('No content in AI response');
      return new Response(
        JSON.stringify({ error: 'No response from AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('AI response received, parsing JSON');

    // Try to parse the JSON from the response
    let extractedData;
    try {
      // Remove any markdown code blocks if present
      let jsonStr = content.trim();
      
      // Strip markdown code blocks
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7);
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3);
      }
      jsonStr = jsonStr.trim();
      
      // Try to extract JSON object if there's extra content
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
      
      extractedData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError, content);
      
      // Try one more approach: regex extract and basic cleanup
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          extractedData = JSON.parse(jsonMatch[0]);
        } else {
          throw parseError;
        }
      } catch (secondError) {
        console.error('Second parse attempt also failed');
        return new Response(
          JSON.stringify({ error: 'Failed to parse extracted data', rawContent: content }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('Successfully extracted project data');

    return new Response(
      JSON.stringify({ success: true, data: extractedData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in parse-project-brochure function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
