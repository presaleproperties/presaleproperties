/**
 * Scrape Research Report
 * Scrapes MLA Canada or Rennie Intelligence research reports and extracts market data
 * Uses Firecrawl for web scraping and AI for data extraction
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://presaleproperties.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScrapeRequest {
  url: string;
  source?: "mla" | "rennie" | "auto";
  generateBlog?: boolean;
  updateMarketData?: boolean;
}

interface ExtractedData {
  source: string;
  sourceUrl: string;
  title: string;
  publishDate: string;
  summary: string;
  keyInsights: string[];
  marketData: {
    city?: string;
    avgPriceSqft?: number;
    benchmarkCondo?: number;
    benchmarkTownhome?: number;
    yoyChange?: number;
    salesVolume?: number;
    daysOnMarket?: number;
  }[];
  rawContent: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, source, generateBlog = true, updateMarketData = true }: ScrapeRequest = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Firecrawl API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Scraping research report: ${url}`);

    // Detect source from URL
    const detectedSource = source === "auto" || !source
      ? url.includes("mlacanada") || url.includes("mla-canada") ? "mla"
        : url.includes("rennie") ? "rennie" : "mla"
      : source;

    // Scrape the page using Firecrawl
    const firecrawlResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${firecrawlApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown", "html"],
        onlyMainContent: true,
      }),
    });

    if (!firecrawlResponse.ok) {
      const errorText = await firecrawlResponse.text();
      console.error("Firecrawl error:", errorText);
      return new Response(
        JSON.stringify({ success: false, error: `Failed to scrape URL: ${firecrawlResponse.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const scrapeResult = await firecrawlResponse.json();
    const pageContent = scrapeResult.data?.markdown || scrapeResult.data?.html || "";
    const pageTitle = scrapeResult.data?.metadata?.title || "Research Report";

    if (!pageContent || pageContent.length < 200) {
      return new Response(
        JSON.stringify({ success: false, error: "Could not extract sufficient content from the page" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Extracted ${pageContent.length} characters from ${url}`);

    // Use AI to extract structured data from the content
    const aiApiKey = Deno.env.get("LOVABLE_AI_GATEWAY_API_KEY") || Deno.env.get("OPENAI_API_KEY");
    
    const extractionPrompt = `You are an expert real estate market analyst. Extract structured data from this ${detectedSource === "mla" ? "MLA Canada" : "Rennie Intelligence"} research report.

REPORT CONTENT:
${pageContent.substring(0, 15000)}

Extract the following JSON structure:
{
  "title": "Report title",
  "publishDate": "YYYY-MM-DD or approximate",
  "summary": "2-3 sentence summary of key findings",
  "keyInsights": ["insight 1", "insight 2", ...], // 3-5 key market insights
  "marketData": [
    {
      "city": "City name (Vancouver, Surrey, Burnaby, etc.)",
      "avgPriceSqft": number or null,
      "benchmarkCondo": number or null,
      "benchmarkTownhome": number or null,
      "yoyChange": percentage as number (e.g., 5.2 for 5.2%),
      "salesVolume": number or null,
      "daysOnMarket": number or null
    }
  ]
}

Focus on BC Lower Mainland cities. Include all quantitative data found.
Return ONLY valid JSON, no markdown or explanation.`;

    const aiResponse = await fetch("https://ai-gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${aiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "user", content: extractionPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      console.error("AI extraction failed:", await aiResponse.text());
      return new Response(
        JSON.stringify({ success: false, error: "AI extraction failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResult = await aiResponse.json();
    const extractedText = aiResult.choices?.[0]?.message?.content || "";
    
    // Parse the JSON from AI response
    let extractedData: Partial<ExtractedData>;
    try {
      const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in AI response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to parse extracted data",
          rawContent: pageContent.substring(0, 2000)
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Enhance with source info
    const fullData: ExtractedData = {
      source: detectedSource === "mla" ? "MLA Canada" : "Rennie Intelligence",
      sourceUrl: url,
      title: extractedData.title || pageTitle,
      publishDate: extractedData.publishDate || new Date().toISOString().split('T')[0],
      summary: extractedData.summary || "",
      keyInsights: extractedData.keyInsights || [],
      marketData: extractedData.marketData || [],
      rawContent: pageContent.substring(0, 5000),
    };

    console.log(`Extracted data for ${fullData.marketData?.length || 0} cities`);

    return new Response(
      JSON.stringify({
        success: true,
        data: fullData,
        generateBlog,
        updateMarketData,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Scrape error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
