import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://presaleproperties.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImageAnalysis {
  url: string;
  category: 'hero' | 'exterior' | 'interior' | 'amenity' | 'floorplan' | 'lifestyle' | 'other';
  quality: number; // 1-10
  description: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrls, projectName } = await req.json();
    
    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No images provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Analyzing ${imageUrls.length} images for project: ${projectName || 'Unknown'}`);

    // Build content array with images for vision analysis
    const imageContent = imageUrls.slice(0, 20).map((url: string, index: number) => ({
      type: 'image_url',
      image_url: { url }
    }));

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert real estate photo analyst. Analyze the provided images and categorize them for a real estate project listing.

For each image, determine:
1. Category: hero (best overall shot, usually exterior with great lighting), exterior, interior, amenity, floorplan, lifestyle, or other
2. Quality score 1-10 (consider lighting, composition, resolution, appeal)
3. Brief description

Return a JSON array with one object per image in the SAME ORDER as provided.
The first image should be the best "hero" candidate - the most impressive, high-quality exterior or lifestyle shot.
Sort the rest by quality within their categories.

IMPORTANT: Return ONLY valid JSON, no markdown, no explanation.`
          },
          {
            role: 'user',
            content: [
              { 
                type: 'text', 
                text: `Analyze these ${imageUrls.length} images for the real estate project "${projectName || 'New Project'}". Return a JSON array with objects containing: index (0-based), category, quality, description. Sort them so the best hero image is first, then by quality.`
              },
              ...imageContent
            ]
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'sort_images',
              description: 'Return sorted image analysis results',
              parameters: {
                type: 'object',
                properties: {
                  sortedImages: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        index: { type: 'number', description: 'Original index of the image (0-based)' },
                        category: { type: 'string', enum: ['hero', 'exterior', 'interior', 'amenity', 'floorplan', 'lifestyle', 'other'] },
                        quality: { type: 'number', description: 'Quality score 1-10' },
                        description: { type: 'string', description: 'Brief description of the image' }
                      },
                      required: ['index', 'category', 'quality', 'description']
                    }
                  }
                },
                required: ['sortedImages']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'sort_images' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded, please try again later' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted, please add funds' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI processing failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response received');

    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error('No tool call response from AI');
    }

    const analysisResult = JSON.parse(toolCall.function.arguments);
    const sortedImages = analysisResult.sortedImages;

    // Map back to original URLs in sorted order
    const sortedImageUrls = sortedImages.map((item: any) => ({
      url: imageUrls[item.index],
      category: item.category,
      quality: item.quality,
      description: item.description
    }));

    console.log(`Sorted ${sortedImageUrls.length} images, hero: ${sortedImageUrls[0]?.category}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sortedImages: sortedImageUrls,
        heroIndex: 0 // First image is the hero
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in sort-project-images:', error);
    const message = error instanceof Error ? error.message : 'Failed to analyze images';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
