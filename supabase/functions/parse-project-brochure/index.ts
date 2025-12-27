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

    const systemPrompt = `You are a real estate project data extraction assistant. Extract project information from the provided brochure/information sheet text.

Return the data by calling the provided tool. Do NOT return JSON in plain text.`;

    const userPrompt = `Extract project data from this ${documentType || 'brochure'}:\n\n${documentText}`;

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
              description: 'Extract structured presale project data from brochure text.',
              parameters: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  name: { type: 'string' },
                  developer_name: { type: 'string' },
                  city: { type: 'string' },
                  neighborhood: { type: 'string' },
                  address: { type: 'string' },
                  project_type: { type: 'string', enum: ['condo', 'townhome', 'mixed'] },
                  unit_mix: { type: 'string' },
                  starting_price: { type: ['number', 'null'] },
                  price_range: { type: 'string' },
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
                  'price_range',
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
