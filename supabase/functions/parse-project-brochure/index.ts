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

    const systemPrompt = `You are a real estate project data extraction assistant. Extract project information from the provided sources.

IMPORTANT: When data conflicts between sources, ALWAYS prioritize the DEVELOPER WEBSITE data over brochure data. The website contains the most current and accurate information.

Extract all available information and merge intelligently:
- Use website data as the primary source for all fields
- Fill in gaps from brochure data only when website doesn't have the info
- For pricing, use the most current/accurate figures (usually from website)

Return the data by calling the provided tool. Do NOT return JSON in plain text.`;

    const userPrompt = `Extract project data from these sources:\n\n${combinedContext}`;

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
              description: 'Extract structured presale project data from brochure and/or website text.',
              parameters: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  name: { type: 'string' },
                  developer_name: { type: 'string' },
                  city: { type: 'string' },
                  neighborhood: { type: 'string' },
                  address: { type: 'string' },
                  project_type: { type: 'string', enum: ['condo', 'townhome', 'mixed', 'duplex', 'single_family'] },
                  unit_mix: { type: 'string' },
                  starting_price: { type: ['number', 'null'] },
                  deposit_structure: { type: 'string' },
                  incentives: { type: 'string' },
                  completion_month: { type: ['number', 'null'] },
                  completion_year: { type: ['number', 'null'] },
                  occupancy_estimate: { type: 'string' },
                  short_description: { type: 'string' },
                  full_description: { type: 'string' },
                  highlights: { type: 'array', items: { type: 'string' } },
                  amenities: { type: 'array', items: { type: 'string' } },
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
                  'incentives',
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
