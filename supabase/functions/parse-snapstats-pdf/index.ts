import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// City mappings for each edition
const EDITION_CITIES: Record<string, string[]> = {
  'FVR': ['Surrey', 'South Surrey', 'White Rock', 'Langley', 'Abbotsford', 'Mission', 'Cloverdale', 'North Delta'],
  'GVR': ['Burnaby', 'New Westminster', 'Coquitlam', 'Port Coquitlam', 'Port Moody', 'Pitt Meadows', 'Maple Ridge'],
  'MVR': ['Vancouver', 'Richmond', 'North Vancouver', 'West Vancouver', 'Delta', 'Ladner', 'Tsawwassen'],
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentText, reportMonth, reportYear, edition } = await req.json();

    if (!documentText) {
      return new Response(
        JSON.stringify({ error: 'Document text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Parsing ${edition} Snap Stats for ${reportMonth}/${reportYear}, text length:`, documentText.length);

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cities = EDITION_CITIES[edition] || EDITION_CITIES['FVR'];
    const boardName = edition === 'FVR' ? 'Fraser Valley Real Estate Board' 
                    : edition === 'GVR' ? 'Greater Vancouver REALTORS®'
                    : 'Metro Vancouver Real Estate Board';

    const systemPrompt = `You are a real estate market data extraction expert for BC Canada. Extract DETAILED statistics from this ${boardName} Snap Stats report.

CITIES TO EXTRACT: ${cities.join(', ')}

For EACH CITY, extract data separately for CONDOS and TOWNHOMES. The report has separate pages for each property type.

Extract these fields for each city + property_type combination:

1. **benchmark_price** or **median_sale_price**: The benchmark/median sale price for the property type
2. **avg_price_sqft**: Calculate from sale_price / typical_sqft (750 for condos, 1200 for townhomes)
3. **total_inventory**: Active listings count
4. **total_sales**: Number of sold units
5. **sales_ratio**: Sales-to-listings ratio percentage (if 84 sold out of 1188 inventory = 7%)
6. **days_on_market**: Average DOM
7. **sale_to_list_ratio**: e.g., 97% means selling 3% below list
8. **hottest_price_band**: The price range with highest sales ratio (e.g., "$1M - $1.25M")
9. **hottest_price_band_ratio**: The sales ratio for that band (e.g., 27)
10. **market_type**: "buyers" if sales_ratio < 12%, "balanced" if 12-20%, "sellers" if > 20%
11. **yoy_price_change**: Year-over-year % change if available from 13-month trend
12. **mom_price_change**: Month-over-month % change from trend data

IMPORTANT:
- Extract BOTH condo AND townhome data separately for each city
- Look for "CONDOS & TOWNHOMES" sections but also dedicated TOWNHOMES sections
- The Market Summary section contains key insights
- Use the 13-Month Market Trend charts for price trend data
- If a city shows "S SURREY WHITE ROCK", map to "South Surrey"
- If combining data, note which cities are combined`;

    const userPrompt = `Extract all condo and townhome market statistics from this ${boardName} Snap Stats report for ${reportMonth}/${reportYear}:

${documentText}`;

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
              name: 'extract_snapstats',
              description: 'Extract structured condo and townhome market statistics from Snap Stats report.',
              parameters: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  report_period: {
                    type: 'object',
                    properties: {
                      month: { type: 'number' },
                      year: { type: 'number' },
                      edition: { type: 'string' },
                      board: { type: 'string' },
                    },
                    required: ['month', 'year', 'edition', 'board'],
                  },
                  city_stats: {
                    type: 'array',
                    items: {
                      type: 'object',
                      additionalProperties: false,
                      properties: {
                        city: { type: 'string' },
                        property_type: { type: 'string', enum: ['condo', 'townhome'] },
                        benchmark_price: { type: ['number', 'null'] },
                        avg_price_sqft: { type: ['number', 'null'] },
                        median_sale_price: { type: ['number', 'null'] },
                        total_inventory: { type: ['number', 'null'] },
                        total_sales: { type: ['number', 'null'] },
                        sales_ratio: { type: ['number', 'null'] },
                        days_on_market: { type: ['number', 'null'] },
                        sale_to_list_ratio: { type: ['number', 'null'] },
                        hottest_price_band: { type: ['string', 'null'] },
                        hottest_price_band_ratio: { type: ['number', 'null'] },
                        market_type: { type: ['string', 'null'], enum: ['buyers', 'balanced', 'sellers', null] },
                        yoy_price_change: { type: ['number', 'null'] },
                        mom_price_change: { type: ['number', 'null'] },
                        avg_rent_1br: { type: ['number', 'null'] },
                        avg_rent_2br: { type: ['number', 'null'] },
                      },
                      required: ['city', 'property_type'],
                    },
                  },
                  market_summary: {
                    type: 'string',
                    description: 'Overall 2-3 sentence summary of the regional market conditions',
                  },
                  key_insights: {
                    type: 'array',
                    items: { type: 'string' },
                    description: '4-6 key market insights or trends from the report',
                  },
                },
                required: ['report_period', 'city_stats', 'market_summary', 'key_insights'],
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'extract_snapstats' } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please wait a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Failed to process with AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const argsStr = toolCall?.function?.arguments;

    if (!argsStr) {
      return new Response(
        JSON.stringify({ error: 'AI did not return structured data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let extractedData;
    try {
      extractedData = JSON.parse(argsStr);
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate rental yields for condos if missing
    const RENT_ESTIMATES: Record<string, { rent1br: number; rent2br: number }> = {
      'Surrey': { rent1br: 1800, rent2br: 2300 },
      'South Surrey': { rent1br: 2000, rent2br: 2600 },
      'Langley': { rent1br: 1850, rent2br: 2400 },
      'Abbotsford': { rent1br: 1600, rent2br: 2100 },
      'Burnaby': { rent1br: 2200, rent2br: 2800 },
      'Vancouver': { rent1br: 2500, rent2br: 3300 },
      'Richmond': { rent1br: 2100, rent2br: 2700 },
      'Coquitlam': { rent1br: 2000, rent2br: 2600 },
      'New Westminster': { rent1br: 1900, rent2br: 2500 },
      'North Vancouver': { rent1br: 2300, rent2br: 3000 },
    };

    for (const stat of extractedData.city_stats) {
      if (stat.property_type === 'condo') {
        const rents = RENT_ESTIMATES[stat.city] || { rent1br: 1900, rent2br: 2500 };
        if (!stat.avg_rent_1br) stat.avg_rent_1br = rents.rent1br;
        if (!stat.avg_rent_2br) stat.avg_rent_2br = rents.rent2br;
        
        // Calculate rental yield if we have price and rent
        const price = stat.benchmark_price || stat.median_sale_price;
        if (price && stat.avg_rent_2br) {
          stat.rental_yield = Number(((stat.avg_rent_2br * 12) / price * 100).toFixed(2));
        }
      }
    }

    console.log(`Extracted ${extractedData.city_stats.length} city/type combinations`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: extractedData,
        statsCount: extractedData.city_stats.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in parse-snapstats-pdf:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
