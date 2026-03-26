/**
 * Process Research Webhook
 * Receives URLs from Zapier (via WhatsApp/Email) and processes research reports
 * Auto-generates blog posts and updates market data
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendEmail } from "../_shared/gmail-smtp.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://presaleproperties.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WebhookPayload {
  url?: string;
  urls?: string[];
  message?: string; // Raw message that might contain URLs
  source?: string;
  notifyEmail?: string;
}

// Extract URLs from text
function extractUrls(text: string): string[] {
  const urlPattern = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
  const matches = text.match(urlPattern) || [];
  // Filter for research-related URLs
  return matches.filter(url => 
    url.includes("mlacanada") || 
    url.includes("mla-canada") || 
    url.includes("rennie") ||
    url.includes("presalepulse") ||
    url.includes("presale-pulse") ||
    url.includes("intelligence")
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: WebhookPayload = await req.json();
    
    // Extract URLs from various input formats
    let urls: string[] = [];
    
    if (payload.url) {
      urls.push(payload.url);
    }
    if (payload.urls && Array.isArray(payload.urls)) {
      urls.push(...payload.urls);
    }
    if (payload.message) {
      urls.push(...extractUrls(payload.message));
    }

    // Remove duplicates
    urls = [...new Set(urls)];

    if (urls.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "No valid research URLs found in the message",
          hint: "Send a message containing URLs from MLA Canada or Rennie Intelligence"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${urls.length} research URLs from webhook`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results: { url: string; success: boolean; blogTitle?: string; error?: string }[] = [];

    for (const url of urls) {
      try {
        // Call the scrape function
        const scrapeResponse = await fetch(`${supabaseUrl}/functions/v1/scrape-research-report`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${supabaseServiceKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url,
            source: "auto",
            generateBlog: true,
            updateMarketData: true,
          }),
        });

        if (!scrapeResponse.ok) {
          results.push({ url, success: false, error: "Scrape failed" });
          continue;
        }

        const scrapeData = await scrapeResponse.json();
        
        if (!scrapeData.success || !scrapeData.data) {
          results.push({ url, success: false, error: scrapeData.error || "No data extracted" });
          continue;
        }

        const data = scrapeData.data;

        // Update market data if we have city-level data
        if (scrapeData.updateMarketData && data.marketData?.length > 0) {
          const today = new Date().toISOString().split('T')[0];
          
          for (const cityData of data.marketData) {
            if (!cityData.city) continue;

            const updatePayload: Record<string, unknown> = {
              city: cityData.city,
              source_name: data.source,
              source_url: data.sourceUrl,
              last_verified_date: today,
              notes: `From ${data.source} report: ${data.title}. ${data.summary}`,
            };

            if (cityData.avgPriceSqft) updatePayload.avg_price_sqft = cityData.avgPriceSqft;
            if (cityData.yoyChange) updatePayload.appreciation_5yr = Math.round(cityData.yoyChange * 4.5);

            const { error } = await supabase
              .from("market_data")
              .upsert(updatePayload, { onConflict: "city" });

            if (error) {
              console.error(`Failed to update ${cityData.city}:`, error);
            }
          }
        }

        // Generate blog post
        if (scrapeData.generateBlog) {
          const blogSlug = `${data.source.toLowerCase().replace(/\s+/g, "-")}-${data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").substring(0, 50)}-${Date.now()}`;
          
          // Generate full blog content using AI
          const aiApiKey = Deno.env.get("LOVABLE_AI_GATEWAY_API_KEY");
          
          const blogPrompt = `Create an SEO-optimized blog post based on this ${data.source} research report.

REPORT DATA:
Title: ${data.title}
Source: ${data.source}
Summary: ${data.summary}
Key Insights: ${data.keyInsights?.join("; ") || "N/A"}
Market Data: ${JSON.stringify(data.marketData || [])}

REQUIREMENTS:
1. Write a 600-800 word blog post targeting BC presale buyers and investors
2. Use H2 headings for sections
3. Include the key statistics and insights
4. Add analysis and what this means for buyers
5. Reference ${data.source} as the authoritative source
6. Include a call-to-action to explore presale projects
7. Use bullet points for key takeaways
8. SEO-friendly: target keywords like "BC presale market", "Metro Vancouver real estate", city names mentioned

Return JSON:
{
  "title": "Blog title (60 chars max)",
  "seoTitle": "SEO title with keyword",
  "seoDescription": "155 char meta description",
  "excerpt": "2-3 sentence summary",
  "content": "Full HTML content with <h2>, <p>, <ul>, <li> tags",
  "tags": ["tag1", "tag2"]
}`;

          const aiResponse = await fetch("https://ai-gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${aiApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [{ role: "user", content: blogPrompt }],
              temperature: 0.7,
            }),
          });

          if (aiResponse.ok) {
            const aiResult = await aiResponse.json();
            const blogText = aiResult.choices?.[0]?.message?.content || "";
            
            try {
              const jsonMatch = blogText.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const blogData = JSON.parse(jsonMatch[0]);
                
                // Add source citation to content
                const citedContent = `${blogData.content}
<div style="margin-top: 24px; padding: 16px; background: #f8f9fa; border-left: 4px solid #f5c542; border-radius: 4px;">
  <p style="margin: 0; font-size: 14px;">
    <strong>Source:</strong> This analysis is based on research from 
    <a href="${data.sourceUrl}" target="_blank" rel="noopener noreferrer">${data.source}</a> - 
    "${data.title}" (${data.publishDate}).
  </p>
</div>`;

                // Save blog draft
                const { error: blogError } = await supabase
                  .from("blog_posts")
                  .insert({
                    title: blogData.title,
                    slug: blogSlug,
                    excerpt: blogData.excerpt,
                    content: citedContent,
                    seo_title: blogData.seoTitle,
                    seo_description: blogData.seoDescription,
                    tags: blogData.tags,
                    category: "Market Updates",
                    is_published: false,
                    is_featured: false,
                  });

                if (!blogError) {
                  results.push({ url, success: true, blogTitle: blogData.title });
                } else {
                  results.push({ url, success: false, error: "Failed to save blog" });
                }
              }
            } catch (parseErr) {
              console.error("Blog parse error:", parseErr);
              results.push({ url, success: false, error: "Failed to generate blog content" });
            }
          }
        }

      } catch (urlError) {
        console.error(`Error processing ${url}:`, urlError);
        results.push({ url, success: false, error: String(urlError) });
      }
    }

    const successCount = results.filter(r => r.success).length;
    
    // Send notification email if configured
    const notifyEmail = payload.notifyEmail || Deno.env.get("ADMIN_EMAIL") || "info@presaleproperties.com";
    
    if (successCount > 0) {
      const blogList = results
        .filter(r => r.success && r.blogTitle)
        .map(r => `<li><strong>${r.blogTitle}</strong><br/><span style="color: #666; font-size: 12px;">${r.url}</span></li>`)
        .join("");

      await sendEmail({
        to: notifyEmail,
        subject: `📊 ${successCount} Research Report(s) Processed`,
        html: `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 24px; text-align: center;">
      <h1 style="color: #f5c542; margin: 0; font-size: 20px;">📊 Research Reports Processed</h1>
    </div>
    <div style="padding: 24px;">
      <p>${successCount} research report(s) have been processed. Blog drafts are ready for review:</p>
      <ul style="padding-left: 20px;">${blogList}</ul>
      <div style="text-align: center; margin-top: 24px;">
        <a href="https://presaleproperties.com/admin/blogs" 
           style="display: inline-block; background: #f5c542; color: #1a1a2e; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Review Blog Drafts →
        </a>
      </div>
    </div>
  </div>
</body>
</html>
        `,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: urls.length,
        successful: successCount,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
