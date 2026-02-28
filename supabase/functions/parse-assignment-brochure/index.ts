import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://presaleproperties.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentText } = await req.json();

    if (!documentText) {
      return new Response(
        JSON.stringify({ error: 'Document text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Parsing assignment brochure, length:', documentText.length);

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `You are an expert at extracting real estate assignment listing data from BC (British Columbia) presale project brochures and floorplans.

CONTEXT: An agent is creating an assignment listing (reselling their presale contract before completion). They've uploaded a project brochure or floorplan PDF. Your job is to extract all relevant unit and project details.

EXTRACTION GUIDELINES:
- **project_name**: The official project/building name (e.g., "The Park Residences", "Jericho")
- **developer_name**: The developer/builder company name
- **city**: The city in BC (e.g., "Vancouver", "Surrey", "Langley")
- **neighborhood**: The specific neighborhood or area (e.g., "Fairview", "Guildford")
- **address**: Full street address if available
- **property_type**: Type - "condo", "townhouse", or "other"
- **unit_type**: Unit type - "studio", "1bed", "1bed_den", "2bed", "2bed_den", "3bed", or "penthouse"
- **beds**: Number of bedrooms as a NUMBER (0 for studio)
- **baths**: Number of bathrooms as a NUMBER
- **interior_sqft**: Interior square footage as a NUMBER
- **exterior_sqft**: Balcony/patio square footage as a NUMBER
- **floor_level**: Floor number as a NUMBER
- **exposure**: View direction (e.g., "North", "SW", "East/West")
- **original_price**: The original purchase price as a NUMBER (e.g., 899000)
- **completion_month**: Expected completion month 1-12 as a NUMBER
- **completion_year**: Expected completion year as a NUMBER (e.g., 2027)
- **construction_status**: Current status - "pre_construction", "under_construction", or "completed"
- **has_parking**: Boolean - true if parking is included
- **parking_count**: Number of parking stalls as a NUMBER
- **has_storage**: Boolean - true if storage locker is included
- **description**: A brief description of the unit and its features

IMPORTANT TIPS:
- Look for floorplan labels like "Plan A1", "Unit 1203", etc. to find unit details
- Square footages are often listed as "Interior: 650 SF" or "Balcony: 75 SF"
- Look for completion dates like "Estimated Completion: Fall 2027"
- If you see pricing tiers, extract the specific unit price if identifiable
- Parking and storage are often listed as "1 Parking Stall Included" or "Storage: Yes"

Return the data by calling the provided tool. Do NOT return JSON in plain text.`;

    const userPrompt = `Extract assignment listing data from this brochure/floorplan:\n\n${documentText.substring(0, 30000)}`;

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
          { role: 'user', content: userPrompt }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_assignment_data',
              description: 'Extract structured assignment listing data from a presale project brochure or floorplan PDF.',
              parameters: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  project_name: { type: 'string', description: 'Official project/building name' },
                  developer_name: { type: 'string', description: 'Developer company name' },
                  city: { type: 'string', description: 'City in BC' },
                  neighborhood: { type: 'string', description: 'Neighborhood or area' },
                  address: { type: 'string', description: 'Street address if available' },
                  property_type: { type: 'string', enum: ['condo', 'townhouse', 'other'] },
                  unit_type: { type: 'string', enum: ['studio', '1bed', '1bed_den', '2bed', '2bed_den', '3bed', 'penthouse'] },
                  beds: { type: ['number', 'null'], description: 'Number of bedrooms (0 for studio)' },
                  baths: { type: ['number', 'null'], description: 'Number of bathrooms' },
                  interior_sqft: { type: ['number', 'null'], description: 'Interior square footage' },
                  exterior_sqft: { type: ['number', 'null'], description: 'Balcony/patio square footage' },
                  floor_level: { type: ['number', 'null'], description: 'Floor number' },
                  exposure: { type: 'string', description: 'View direction (N, S, E, W, etc.)' },
                  original_price: { type: ['number', 'null'], description: 'Original purchase price' },
                  completion_month: { type: ['number', 'null'], description: 'Completion month 1-12' },
                  completion_year: { type: ['number', 'null'], description: 'Completion year' },
                  construction_status: { type: 'string', enum: ['pre_construction', 'under_construction', 'completed'] },
                  has_parking: { type: 'boolean', description: 'Whether parking is included' },
                  parking_count: { type: ['number', 'null'], description: 'Number of parking stalls' },
                  has_storage: { type: 'boolean', description: 'Whether storage is included' },
                  description: { type: 'string', description: 'Brief unit description' },
                },
                required: [
                  'project_name',
                  'developer_name',
                  'city',
                  'neighborhood',
                  'address',
                  'property_type',
                  'unit_type',
                  'beds',
                  'baths',
                  'interior_sqft',
                  'exterior_sqft',
                  'floor_level',
                  'exposure',
                  'original_price',
                  'completion_month',
                  'completion_year',
                  'construction_status',
                  'has_parking',
                  'parking_count',
                  'has_storage',
                  'description',
                ],
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'extract_assignment_data' } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI usage credits required. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Failed to process document with AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const msg = data.choices?.[0]?.message;

    console.log('AI response received, extracting tool call');

    const toolCall = msg?.tool_calls?.[0];
    const argsStr = toolCall?.function?.arguments;

    if (!argsStr) {
      console.error('No tool call arguments in AI response', msg);
      return new Response(
        JSON.stringify({ error: 'AI did not return structured data', rawContent: msg?.content ?? null }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let extractedData: unknown;
    try {
      extractedData = JSON.parse(argsStr);
    } catch (e) {
      console.error('Failed to parse tool arguments JSON:', e, argsStr);
      return new Response(
        JSON.stringify({ error: 'Failed to parse extracted data', rawContent: argsStr }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully extracted assignment data:', extractedData);

    return new Response(
      JSON.stringify({ success: true, data: extractedData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in parse-assignment-brochure function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
