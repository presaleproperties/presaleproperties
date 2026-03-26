import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://presaleproperties.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentText, reportMonth, reportYear, board } = await req.json();

    if (!documentText) {
      return new Response(
        JSON.stringify({ error: 'Document text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Parsing ${board || 'FVREB'} market stats for ${reportMonth}/${reportYear}, text length:`, documentText.length);

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine which board and cities to extract
    const boardInfo = board === 'REBGV' 
      ? {
          name: 'Real Estate Board of Greater Vancouver',
          cities: ['Vancouver', 'Burnaby', 'Richmond', 'New Westminster', 'Coquitlam', 'Port Moody', 'Port Coquitlam', 'North Vancouver', 'West Vancouver']
        }
      : {
          name: 'Fraser Valley Real Estate Board', 
          cities: ['Surrey', 'Langley', 'Abbotsford', 'Mission', 'Chilliwack', 'Delta', 'White Rock', 'Maple Ridge', 'Pitt Meadows']
        };

    const systemPrompt = `You are a real estate market data extraction expert specializing in BC (British Columbia) real estate statistics. Extract market data from the provided ${boardInfo.name} Snap Stats or monthly statistics report.

EXTRACTION GUIDELINES:
You must extract data for these cities: ${boardInfo.cities.join(', ')}

For each city, extract:
- **city**: The city name exactly as listed above
- **avg_price_sqft**: Average price per square foot for apartments/condos (calculate from benchmark price / typical sqft if not directly stated)
- **benchmark_condo**: The benchmark or average condo price
- **benchmark_townhome**: The benchmark or average townhome price
- **benchmark_detached**: The benchmark or average detached house price
- **avg_rent_1br**: Average 1-bedroom rent (if mentioned, otherwise estimate from CMHC typical rates)
- **avg_rent_2br**: Average 2-bedroom rent (if mentioned)
- **rental_yield**: Rental yield percentage (calculate: annual_rent / condo_price * 100)
- **sales_volume**: Total residential sales for the month
- **active_listings**: Total active listings
- **months_of_inventory**: Months of inventory (supply)
- **yoy_price_change**: Year-over-year price change percentage
- **mom_price_change**: Month-over-month price change percentage
- **days_on_market**: Average days on market

IMPORTANT CALCULATIONS:
1. If avg_price_sqft not stated: benchmark_condo / 750 sqft (typical 2BR size)
2. If rental_yield not stated: (avg_rent_2br * 12) / benchmark_condo * 100
3. If rent data missing, use these CMHC Fraser Valley/Metro Van averages:
   - Surrey 1BR: $1,650, 2BR: $2,100
   - Langley 1BR: $1,700, 2BR: $2,200
   - Vancouver 1BR: $2,500, 2BR: $3,200
   - Burnaby 1BR: $2,100, 2BR: $2,700
   - Richmond 1BR: $2,000, 2BR: $2,600

Return data for ALL cities you can find in the report. Use the tool provided.`;

    const userPrompt = `Extract all market statistics from this ${boardInfo.name} report for ${reportMonth}/${reportYear}:\n\n${documentText}`;

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
              name: 'extract_market_stats',
              description: 'Extract structured market statistics for multiple cities from a real estate board report.',
              parameters: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  report_period: {
                    type: 'object',
                    properties: {
                      month: { type: 'number', description: 'Report month 1-12' },
                      year: { type: 'number', description: 'Report year' },
                      board: { type: 'string', description: 'Real estate board name' },
                    },
                    required: ['month', 'year', 'board'],
                  },
                  cities: {
                    type: 'array',
                    items: {
                      type: 'object',
                      additionalProperties: false,
                      properties: {
                        city: { type: 'string' },
                        avg_price_sqft: { type: ['number', 'null'] },
                        benchmark_condo: { type: ['number', 'null'] },
                        benchmark_townhome: { type: ['number', 'null'] },
                        benchmark_detached: { type: ['number', 'null'] },
                        avg_rent_1br: { type: ['number', 'null'] },
                        avg_rent_2br: { type: ['number', 'null'] },
                        rental_yield: { type: ['number', 'null'] },
                        sales_volume: { type: ['number', 'null'] },
                        active_listings: { type: ['number', 'null'] },
                        months_of_inventory: { type: ['number', 'null'] },
                        yoy_price_change: { type: ['number', 'null'] },
                        mom_price_change: { type: ['number', 'null'] },
                        days_on_market: { type: ['number', 'null'] },
                      },
                      required: ['city'],
                    },
                  },
                  market_summary: {
                    type: 'string',
                    description: 'A 2-3 sentence summary of overall market conditions from the report',
                  },
                  key_trends: {
                    type: 'array',
                    items: { type: 'string' },
                    description: '3-5 key market trends or insights from the report',
                  },
                },
                required: ['report_period', 'cities', 'market_summary', 'key_trends'],
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'extract_market_stats' } },
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
    const toolCall = msg?.tool_calls?.[0];
    const argsStr = toolCall?.function?.arguments;

    if (!argsStr) {
      console.error('No tool call arguments in AI response', msg);
      return new Response(
        JSON.stringify({ error: 'AI did not return structured data', rawContent: msg?.content ?? null }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let extractedData: {
      report_period: { month: number; year: number; board: string };
      cities: Array<{
        city: string;
        avg_price_sqft?: number | null;
        benchmark_condo?: number | null;
        benchmark_townhome?: number | null;
        benchmark_detached?: number | null;
        avg_rent_1br?: number | null;
        avg_rent_2br?: number | null;
        rental_yield?: number | null;
        sales_volume?: number | null;
        active_listings?: number | null;
        months_of_inventory?: number | null;
        yoy_price_change?: number | null;
        mom_price_change?: number | null;
        days_on_market?: number | null;
      }>;
      market_summary: string;
      key_trends: string[];
    };

    try {
      extractedData = JSON.parse(argsStr);
    } catch (e) {
      console.error('Failed to parse tool arguments JSON:', e, argsStr);
      return new Response(
        JSON.stringify({ error: 'Failed to parse extracted data', rawContent: argsStr }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully extracted data for ${extractedData.cities.length} cities`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: extractedData,
        citiesFound: extractedData.cities.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in parse-market-stats function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
