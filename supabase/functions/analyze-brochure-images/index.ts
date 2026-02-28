import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://presaleproperties.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImageInput {
  url: string;
  width: number;
  height: number;
  pageNum: number;
  index: number;
}

interface AnalyzedImage {
  url: string;
  width: number;
  height: number;
  pageNum: number;
  category: 'exterior' | 'interior' | 'amenities' | 'neighborhood' | 'floorplan' | 'siteplan' | 'lifestyle' | 'other';
  qualityScore: number; // 1-10
  isPrimary: boolean;
  storyOrder: number;
  altText: string;
  isDuplicate: boolean;
  notes: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { images, projectName } = await req.json() as { images: ImageInput[]; projectName?: string };

    if (!images || images.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No images provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build image content for AI analysis
    const imageContents = images.slice(0, 12).map((img, idx) => ({
      type: "image_url" as const,
      image_url: { url: img.url }
    }));

    const imageDescriptions = images.slice(0, 12).map((img, idx) => 
      `Image ${idx + 1}: ${img.width}x${img.height}px from page ${img.pageNum}`
    ).join('\n');


    const systemPrompt = `You are BrochureImageAI, an expert at analyzing real estate marketing brochure images.

Your job is to analyze each image and:
1. CLASSIFY into exactly one category:
   - "exterior" - Building exterior renderings, facade shots
   - "interior" - Unit interiors, kitchens, bedrooms, living rooms
   - "amenities" - Gyms, pools, rooftops, lobbies, common areas
   - "lifestyle" - People enjoying spaces, lifestyle photography
   - "neighborhood" - Surrounding area, nearby attractions, maps
   - "floorplan" - Unit floor plans, layouts with dimensions
   - "siteplan" - Building site plans, lot layouts
   - "other" - Anything that doesn't fit above

2. SCORE quality 1-10 based on:
   - Clarity/sharpness (30%)
   - Emotional impact/premium feel (25%)
   - Project identity representation (25%)
   - Composition (10%)
   - Uniqueness (10%)

3. DETECT DUPLICATES - mark if very similar to another image

4. SELECT PRIMARY (hero) image - choose exactly ONE:
   - Prefer the best exterior rendering
   - If no strong exterior, choose best amenity/lifestyle shot
   - NEVER choose floorplan as primary
   - Must be high quality, emotionally impactful, represents the project

5. ASSIGN story order (for a buyer-friendly property page):
   1. Primary/Hero exterior (1)
   2. Other exteriors (2-6)
   3. Amenities/lifestyle (7-14)
   4. Interiors (15-24)
   5. Neighborhood (25-29)
   6. Site plans (30)
   7. Floorplans (31+)

Return a JSON array with one object per image in this exact format:
{
  "images": [
    {
      "index": 0,
      "category": "exterior",
      "qualityScore": 9,
      "isPrimary": true,
      "storyOrder": 1,
      "altText": "Modern glass tower exterior at sunset",
      "isDuplicate": false,
      "notes": ""
    }
  ],
  "summary": {
    "primaryReason": "Best exterior shot with dramatic lighting and clear building identity",
    "categoryCounts": { "exterior": 2, "interior": 3, "floorplan": 2 }
  }
}`;

    const userPrompt = `Analyze these ${images.length} images from a real estate brochure${projectName ? ` for "${projectName}"` : ''}:

${imageDescriptions}

Return the JSON analysis for each image. Remember:
- Exactly ONE image must have isPrimary: true
- No floorplan can be primary
- Story order should create a logical buyer journey
- Mark duplicates but still include them`;

    console.log(`Analyzing ${images.length} images...`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: [
              { type: 'text', text: userPrompt },
              ...imageContents
            ]
          }
        ],
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI analysis failed: ${response.status}`);
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || '';

    // Parse JSON from AI response
    let analysisResult;
    try {
      // Extract JSON from response (may be wrapped in markdown)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      // Fallback: return basic analysis
      analysisResult = {
        images: images.map((img, idx) => ({
          index: idx,
          category: 'other',
          qualityScore: 5,
          isPrimary: idx === 0,
          storyOrder: idx + 1,
          altText: `Image ${idx + 1}`,
          isDuplicate: false,
          notes: 'AI analysis unavailable'
        })),
        summary: {
          primaryReason: 'Selected first image as fallback',
          categoryCounts: { other: images.length }
        }
      };
    }

    // Merge analysis with original image data
    const analyzedImages: AnalyzedImage[] = images.map((img, idx) => {
      const analysis = analysisResult.images?.find((a: any) => a.index === idx) || {
        category: 'other',
        qualityScore: 5,
        isPrimary: idx === 0,
        storyOrder: idx + 1,
        altText: `Image ${idx + 1}`,
        isDuplicate: false,
        notes: ''
      };

      return {
        url: img.url,
        width: img.width,
        height: img.height,
        pageNum: img.pageNum,
        category: analysis.category,
        qualityScore: analysis.qualityScore,
        isPrimary: analysis.isPrimary,
        storyOrder: analysis.storyOrder,
        altText: analysis.altText,
        isDuplicate: analysis.isDuplicate,
        notes: analysis.notes
      };
    });

    // Sort by story order
    analyzedImages.sort((a, b) => a.storyOrder - b.storyOrder);

    // Ensure exactly one primary
    const primaryCount = analyzedImages.filter(img => img.isPrimary).length;
    if (primaryCount === 0 && analyzedImages.length > 0) {
      // Find best non-floorplan image
      const bestNonFloorplan = analyzedImages.find(img => img.category !== 'floorplan');
      if (bestNonFloorplan) {
        bestNonFloorplan.isPrimary = true;
      } else {
        analyzedImages[0].isPrimary = true;
      }
    } else if (primaryCount > 1) {
      // Keep only highest quality as primary
      let foundPrimary = false;
      analyzedImages.forEach(img => {
        if (img.isPrimary) {
          if (foundPrimary) {
            img.isPrimary = false;
          } else {
            foundPrimary = true;
          }
        }
      });
    }

    console.log(`Analysis complete. Primary: ${analyzedImages.find(i => i.isPrimary)?.altText}`);

    return new Response(
      JSON.stringify({
        success: true,
        images: analyzedImages,
        summary: analysisResult.summary || {}
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error analyzing brochure images:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

