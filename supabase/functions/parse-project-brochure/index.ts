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
    const { documentText, documentType, websiteText, websiteUrl } = await req.json();

    if (!documentText && !websiteText) {
      return new Response(
        JSON.stringify({ error: 'Either document text or website text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Parsing project data, brochure length:', documentText?.length || 0, 'website length:', websiteText?.length || 0);

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build context with priority to website data
    let contextParts: string[] = [];
    
    if (websiteText) {
      contextParts.push(`=== DEVELOPER WEBSITE (PRIMARY SOURCE - prioritize this data) ===\nSource: ${websiteUrl || 'Developer website'}\n\n${websiteText}`);
    }
    
    if (documentText) {
      contextParts.push(`=== BROCHURE/PDF DOCUMENTS (SECONDARY SOURCE) ===\n${documentType || 'Brochure'}\n\n${documentText}`);
    }

    const combinedContext = contextParts.join('\n\n---\n\n');

    const systemPrompt = `You are a real estate project data extraction assistant specializing in BC (British Columbia) presale projects. Extract project information from the provided sources.

IMPORTANT: When data conflicts between sources, ALWAYS prioritize the DEVELOPER WEBSITE data over brochure data. The website contains the most current and accurate information.

EXTRACTION GUIDELINES:
- **name**: The official project name (e.g., "The Park Residences", "Jericho")
- **developer_name**: The developer/builder company name
- **city**: The city in BC (e.g., "Vancouver", "Surrey", "Langley")
- **neighborhood**: The specific neighborhood or area (e.g., "Fairview", "Guildford", "Willowbrook")
- **address**: Full street address if available
- **project_type**: Type of development - condo, townhome, mixed, duplex, or single_family
- **unit_mix**: Unit types available (e.g., "Studios to 3 Bedrooms", "1BR to 3BR + Den")
- **starting_price**: The lowest starting price as a NUMBER (e.g., 499000, not "$499,000")
- **deposit_structure**: Full deposit schedule (e.g., "5% on signing, 5% in 90 days, 5% in 180 days")
- **deposit_percent**: Total deposit percentage as a NUMBER (e.g., 15 or 20)
- **strata_fees**: Monthly strata/maintenance fee info (e.g., "$0.45/sqft/month" or "$350/month")
- **assignment_fees**: Fee charged to assign the contract (e.g., "$5,000" or "1% of purchase price")
- **assignment_allowed**: Whether assignments are permitted - "Yes", "No", or "Unknown"
- **rental_restrictions**: Any rental restrictions (e.g., "None", "1 Year Minimum", "No Rentals Allowed", "Unknown")
- **incentives**: Current promotions or incentives (e.g., "Free parking", "1 year free strata", "Rate buy-down")
- **incentives_available**: Boolean - true if any incentives/promotions are mentioned
- **near_skytrain**: Boolean - true if within walking distance to SkyTrain or mentions transit proximity
- **completion_month**: Expected completion month as NUMBER 1-12
- **completion_year**: Expected completion year as NUMBER (e.g., 2027)
- **occupancy_estimate**: Human-readable estimate (e.g., "Fall 2027", "Q2 2028")
- **short_description**: A brief 1-2 sentence summary for cards/previews
- **full_description**: Detailed project description, preserving key selling points
- **highlights**: Array of 5-10 key selling points as bullet items
- **amenities**: Array of building amenities (gym, pool, concierge, etc.)
- **faq**: Array of Q&A pairs relevant to buyers

Extract all available information and merge intelligently:
- Use website data as the primary source for all fields
- Fill in gaps from brochure data only when website doesn't have the info
- For pricing, use the most current/accurate figures (usually from website)
- Look for deposit schedules, strata fees, and assignment policies in fine print
- Check for SkyTrain, transit, or "minutes to transit" mentions for near_skytrain

Return the data by calling the provided tool. Do NOT return JSON in plain text.`;

    const userPrompt = `Extract all project data from these sources. Pay special attention to pricing, deposits, fees, and policies:\n\n${combinedContext}`;

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
              name: 'extract_project',
              description: 'Extract structured presale project data from brochure and/or website text. Include all financial details, policies, and property information.',
              parameters: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  name: { type: 'string', description: 'Official project name' },
                  developer_name: { type: 'string', description: 'Developer/builder company name' },
                  city: { type: 'string', description: 'City in BC (Vancouver, Surrey, etc.)' },
                  neighborhood: { type: 'string', description: 'Neighborhood or area name' },
                  address: { type: 'string', description: 'Full street address if available' },
                  project_type: { type: 'string', enum: ['condo', 'townhome', 'mixed', 'duplex', 'single_family'] },
                  unit_mix: { type: 'string', description: 'Unit types available (e.g., Studios to 3BR)' },
                  starting_price: { type: ['number', 'null'], description: 'Lowest starting price as number' },
                  deposit_structure: { type: 'string', description: 'Full deposit schedule breakdown' },
                  deposit_percent: { type: ['number', 'null'], description: 'Total deposit percentage (e.g., 15 or 20)' },
                  strata_fees: { type: 'string', description: 'Monthly strata/maintenance fees' },
                  assignment_fees: { type: 'string', description: 'Fee to assign the contract' },
                  assignment_allowed: { type: 'string', enum: ['Yes', 'No', 'Unknown'], description: 'Whether assignments are permitted' },
                  rental_restrictions: { type: 'string', enum: ['None', '1 Year', '2 Years', 'No Rentals', 'Unknown'], description: 'Rental restriction policy' },
                  incentives: { type: 'string', description: 'Current promotions or incentives' },
                  incentives_available: { type: 'boolean', description: 'True if any incentives are mentioned' },
                  near_skytrain: { type: 'boolean', description: 'True if near SkyTrain or mentions transit proximity' },
                  completion_month: { type: ['number', 'null'], description: 'Completion month 1-12' },
                  completion_year: { type: ['number', 'null'], description: 'Completion year (e.g., 2027)' },
                  occupancy_estimate: { type: 'string', description: 'Human-readable estimate (e.g., Fall 2027)' },
                  short_description: { type: 'string', description: 'Brief 1-2 sentence summary' },
                  full_description: { type: 'string', description: 'Detailed project description' },
                  highlights: { type: 'array', items: { type: 'string' }, description: 'Key selling points (5-10 items)' },
                  amenities: { type: 'array', items: { type: 'string' }, description: 'Building amenities list' },
                  faq: {
                    type: 'array',
                    items: {
                      type: 'object',
                      additionalProperties: false,
                      properties: {
                        question: { type: 'string' },
                        answer: { type: 'string' },
                      },
                      required: ['question', 'answer'],
                    },
                    description: 'Common buyer questions and answers',
                  },
                },
                required: [
                  'name',
                  'developer_name',
                  'city',
                  'neighborhood',
                  'address',
                  'project_type',
                  'unit_mix',
                  'starting_price',
                  'deposit_structure',
                  'deposit_percent',
                  'strata_fees',
                  'assignment_fees',
                  'assignment_allowed',
                  'rental_restrictions',
                  'incentives',
                  'incentives_available',
                  'near_skytrain',
                  'completion_month',
                  'completion_year',
                  'occupancy_estimate',
                  'short_description',
                  'full_description',
                  'highlights',
                  'amenities',
                  'faq',
                ],
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'extract_project' } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);

      // Surface common Lovable AI gateway errors
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
