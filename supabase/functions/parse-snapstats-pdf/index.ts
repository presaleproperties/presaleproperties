import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

// Rent estimates for yield calculations
const RENT_ESTIMATES: Record<string, { rent1br: number; rent2br: number }> = {
  'Surrey': { rent1br: 1800, rent2br: 2300 },
  'South Surrey': { rent1br: 2000, rent2br: 2600 },
  'White Rock': { rent1br: 1900, rent2br: 2500 },
  'Langley': { rent1br: 1850, rent2br: 2400 },
  'Abbotsford': { rent1br: 1600, rent2br: 2100 },
  'Mission': { rent1br: 1500, rent2br: 2000 },
  'Cloverdale': { rent1br: 1750, rent2br: 2300 },
  'North Delta': { rent1br: 1700, rent2br: 2200 },
  'Burnaby': { rent1br: 2200, rent2br: 2800 },
  'Vancouver': { rent1br: 2500, rent2br: 3300 },
  'Richmond': { rent1br: 2100, rent2br: 2700 },
  'Coquitlam': { rent1br: 2000, rent2br: 2600 },
  'Port Coquitlam': { rent1br: 1900, rent2br: 2400 },
  'Port Moody': { rent1br: 2100, rent2br: 2700 },
  'Pitt Meadows': { rent1br: 1800, rent2br: 2300 },
  'Maple Ridge': { rent1br: 1700, rent2br: 2200 },
  'New Westminster': { rent1br: 1900, rent2br: 2500 },
  'North Vancouver': { rent1br: 2300, rent2br: 3000 },
  'West Vancouver': { rent1br: 2600, rent2br: 3500 },
  'Delta': { rent1br: 1800, rent2br: 2300 },
  'Ladner': { rent1br: 1850, rent2br: 2400 },
  'Tsawwassen': { rent1br: 1900, rent2br: 2500 },
};

function extractRelevantSections(text: string, cities: string[]): string {
  // Extract just the sections we need - condos and townhomes data
  // Look for key patterns that indicate data sections
  const lines = text.split('\n');
  const relevantLines: string[] = [];
  let inRelevantSection = false;
  let sectionCount = 0;
  
  const cityPatterns = cities.map(c => c.toLowerCase());
  const keywords = ['condo', 'townhome', 'townhouse', 'apartment', 'benchmark', 'median', 
    'active listings', 'sales', 'inventory', 'days on market', 'dom', 'price', 
    'sale to list', 'market summary', 'snapshot', 'market trend'];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();
    
    // Check if this line contains relevant data
    const hasCity = cityPatterns.some(c => lowerLine.includes(c));
    const hasKeyword = keywords.some(k => lowerLine.includes(k));
    const hasNumbers = /\$[\d,]+|\d{1,3},\d{3}|\d+%/.test(line);
    
    if (hasCity || hasKeyword || hasNumbers) {
      // Include context lines around important data
      const startIdx = Math.max(0, i - 2);
      const endIdx = Math.min(lines.length - 1, i + 2);
      
      for (let j = startIdx; j <= endIdx; j++) {
        if (!relevantLines.includes(lines[j])) {
          relevantLines.push(lines[j]);
        }
      }
      sectionCount++;
    }
    
    // Stop if we've collected enough data (keep it under token limits)
    if (relevantLines.length > 2000) break;
  }
  
  console.log(`Extracted ${relevantLines.length} relevant lines from ${lines.length} total lines`);
  
  // Return condensed text, max ~50k chars to keep token count reasonable
  return relevantLines.join('\n').slice(0, 50000);
}

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

    // Extract only relevant sections to reduce token usage
    const condensedText = extractRelevantSections(documentText, cities);
    console.log(`Parsing ${edition} Snap Stats for ${reportMonth}/${reportYear}, condensed text length: ${condensedText.length} (original: ${documentText.length})`);

    const systemPrompt = `You are a real estate market data extraction expert. Extract condo and townhome statistics from this ${boardName} Snap Stats report.

TARGET CITIES: ${cities.join(', ')}

For EACH CITY, extract data for CONDOS and TOWNHOMES separately:
- benchmark_price: The benchmark/typical sale price
- total_inventory: Active listings count  
- total_sales: Number of units sold
- sales_ratio: Sales-to-listings percentage
- days_on_market: Average DOM
- sale_to_list_ratio: % of list price achieved (e.g., 97 means 97%)
- hottest_price_band: Price range with most activity
- hottest_price_band_ratio: Sales ratio for that band
- market_type: "buyers" (<12%), "balanced" (12-20%), "sellers" (>20%)
- yoy_price_change: Year-over-year % change
- mom_price_change: Month-over-month % change

Be thorough - extract every city and property type you can find.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite', // Use lighter model for cost efficiency
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Extract market stats from this ${edition} Snap Stats report for ${reportMonth}/${reportYear}:\n\n${condensedText}` }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_snapstats',
              description: 'Extract condo and townhome market statistics',
              parameters: {
                type: 'object',
                properties: {
                  city_stats: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        city: { type: 'string' },
                        property_type: { type: 'string', enum: ['condo', 'townhome'] },
                        benchmark_price: { type: 'number' },
                        total_inventory: { type: 'number' },
                        total_sales: { type: 'number' },
                        sales_ratio: { type: 'number' },
                        days_on_market: { type: 'number' },
                        sale_to_list_ratio: { type: 'number' },
                        hottest_price_band: { type: 'string' },
                        hottest_price_band_ratio: { type: 'number' },
                        market_type: { type: 'string' },
                        yoy_price_change: { type: 'number' },
                        mom_price_change: { type: 'number' },
                      },
                      required: ['city', 'property_type'],
                    },
                  },
                  market_summary: { type: 'string' },
                },
                required: ['city_stats'],
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
          JSON.stringify({ error: 'Rate limit exceeded. Please wait a moment and try again.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service credit limit reached. Please try again later.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: `AI service error: ${response.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const argsStr = toolCall?.function?.arguments;

    if (!argsStr) {
      console.error('No tool call in response:', JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: 'AI did not return structured data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let extractedData;
    try {
      extractedData = JSON.parse(argsStr);
    } catch (e) {
      console.error('Failed to parse AI response:', argsStr);
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enrich with rental estimates and yield calculations
    for (const stat of extractedData.city_stats || []) {
      if (stat.property_type === 'condo') {
        const rents = RENT_ESTIMATES[stat.city] || { rent1br: 1900, rent2br: 2500 };
        stat.avg_rent_1br = rents.rent1br;
        stat.avg_rent_2br = rents.rent2br;
        
        // Calculate rental yield
        const price = stat.benchmark_price || stat.median_sale_price;
        if (price && stat.avg_rent_2br) {
          stat.rental_yield = Number(((stat.avg_rent_2br * 12) / price * 100).toFixed(2));
        }
        
        // Calculate price per sqft (estimate 750 sqft avg for condos)
        if (price) {
          stat.avg_price_sqft = Math.round(price / 750);
        }
      } else if (stat.property_type === 'townhome') {
        // Townhomes - estimate 1200 sqft avg
        const price = stat.benchmark_price;
        if (price) {
          stat.avg_price_sqft = Math.round(price / 1200);
        }
      }
    }

    console.log(`Extracted ${extractedData.city_stats?.length || 0} city/type combinations`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          report_period: {
            month: reportMonth,
            year: reportYear,
            edition: edition,
            board: boardName,
          },
          city_stats: extractedData.city_stats || [],
          market_summary: extractedData.market_summary || '',
          key_insights: [],
        },
        statsCount: extractedData.city_stats?.length || 0,
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
