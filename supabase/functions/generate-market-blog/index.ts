import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://presaleproperties.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { city, reportMonth, reportYear } = await req.json();

    if (!city) {
      return new Response(
        JSON.stringify({ error: 'City is required' }),
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

    // Fetch market data from database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: marketData, error: fetchError } = await supabase
      .from('market_data')
      .select('*')
      .ilike('city', city)
      .single();

    if (fetchError || !marketData) {
      return new Response(
        JSON.stringify({ error: `No market data found for ${city}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const monthName = new Date(2024, (reportMonth || new Date().getMonth()) - 1).toLocaleString('en', { month: 'long' });
    const year = reportYear || new Date().getFullYear();

    console.log(`Generating market report for ${city}, ${monthName} ${year}`);

    const systemPrompt = `You are an expert real estate market analyst writing for a BC presale homes website. Write professional, data-driven content in STYLED HTML format.

WRITING STYLE:
- Professional, authoritative tone (like a market analyst, not AI)
- Use specific numbers and data points
- Actionable insights for buyers and investors
- 800-1200 words total
- BC-specific context (SkyTrain, neighborhoods, etc.)

HTML FORMAT REQUIREMENTS (use these exact patterns):
- Opening: <p class="text-xl font-medium text-primary mb-6">Hook paragraph</p>
- Headers: <h2 id="section-id">Section Title</h2>
- Styled tables: <table class="w-full border-collapse my-8"><thead><tr class="bg-primary/10">...
- Callout boxes: <div class="bg-primary/5 border-l-4 border-primary p-4 my-6 rounded-r-lg">
- Tip boxes: <div class="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-5 my-6">
- Success boxes: <div class="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-5 my-6">
- Tier cards: <div class="border rounded-xl p-5 bg-primary/5">
- Grid layouts: <div class="grid md:grid-cols-2 gap-6 my-6">
- Bottom line: <div class="bg-primary/10 rounded-xl p-6 my-8"><p class="text-lg font-semibold mb-3">The Bottom Line</p>

DO NOT:
- Use markdown (no ## or **)
- Make up project names
- Sound like AI-generated content
- Use generic filler phrases`;

    const userPrompt = `Write a monthly market update blog post for ${city}, BC for ${monthName} ${year}.

Use this verified market data:
- Average Price per Sq Ft: $${marketData.avg_price_sqft}
- Rental Yield: ${marketData.rental_yield}%
- 5-Year Appreciation: ${marketData.appreciation_5yr}%
- Average 1BR Rent: $${marketData.avg_rent_1br}/month
- Average 2BR Rent: $${marketData.avg_rent_2br}/month
- Data Source: ${marketData.source_name}
- Last Verified: ${marketData.last_verified_date}

Focus on:
1. Current market conditions in ${city}
2. How prices compare to other Metro Vancouver/Fraser Valley cities
3. Rental investment potential given the yield data
4. Recommendations for presale buyers considering ${city}
5. Upcoming developments and growth areas (general, not specific projects)`;

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
              name: 'create_blog_post',
              description: 'Create a structured blog post with all required fields',
              parameters: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  title: { 
                    type: 'string', 
                    description: 'SEO-optimized blog post title (include city name and year)' 
                  },
                  excerpt: { 
                    type: 'string', 
                    description: 'Compelling 2-3 sentence summary for previews (max 200 chars)' 
                  },
                  content: { 
                    type: 'string', 
                    description: 'Full blog post content in markdown format' 
                  },
                  seo_title: { 
                    type: 'string', 
                    description: 'SEO meta title (max 60 chars)' 
                  },
                  seo_description: { 
                    type: 'string', 
                    description: 'SEO meta description (max 160 chars)' 
                  },
                  tags: { 
                    type: 'array', 
                    items: { type: 'string' },
                    description: '5-8 relevant tags for the post' 
                  },
                },
                required: ['title', 'excerpt', 'content', 'seo_title', 'seo_description', 'tags'],
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'create_blog_post' } },
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
        JSON.stringify({ error: 'Failed to generate blog post' }),
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

    let blogData: {
      title: string;
      excerpt: string;
      content: string;
      seo_title: string;
      seo_description: string;
      tags: string[];
    };

    try {
      blogData = JSON.parse(argsStr);
    } catch (e) {
      console.error('Failed to parse blog JSON:', e);
      return new Response(
        JSON.stringify({ error: 'Failed to parse generated content' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate slug
    const slug = `${city.toLowerCase().replace(/\s+/g, '-')}-market-update-${monthName.toLowerCase()}-${year}`;

    // Prepare the blog post record
    const blogPost = {
      title: blogData.title,
      slug,
      excerpt: blogData.excerpt,
      content: blogData.content,
      seo_title: blogData.seo_title,
      seo_description: blogData.seo_description,
      tags: blogData.tags,
      category: 'Market Updates',
      is_published: false, // Draft by default
      is_featured: false,
      featured_image: `/blog/${city.toLowerCase().replace(/\s+/g, '-')}-presales-${year}.jpg`,
    };

    console.log(`Successfully generated blog post: ${blogPost.title}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: blogPost,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in generate-market-blog function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
