import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { website_url } = await req.json();

    if (!website_url) {
      return new Response(
        JSON.stringify({ error: "Website URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize URL
    let url = website_url;
    if (!url.startsWith("http")) {
      url = "https://" + url;
    }

    console.log(`Fetching logo from: ${url}`);

    // Fetch the website HTML
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch website: ${response.status}`);
    }

    const html = await response.text();
    const baseUrl = new URL(url);

    // Extract potential logo URLs using various patterns
    const logoPatterns = [
      // Open Graph image (often the logo)
      /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i,
      /<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i,
      
      // Twitter card image
      /<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i,
      /<meta\s+content=["']([^"']+)["']\s+name=["']twitter:image["']/i,
      
      // Favicon/icon (often contains logo)
      /<link\s+rel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]*href=["']([^"']+)["']/i,
      /<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:icon|shortcut icon|apple-touch-icon)["']/i,
      
      // Common logo patterns in img tags
      /<img[^>]*(?:class|id)=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/i,
      /<img[^>]*src=["']([^"']+)["'][^>]*(?:class|id)=["'][^"']*logo[^"']*["']/i,
      /<img[^>]*alt=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/i,
      /<img[^>]*src=["']([^"']+)["'][^>]*alt=["'][^"']*logo[^"']*["']/i,
      
      // Header logo patterns
      /<header[^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["'][^>]*>/i,
      
      // SVG logos inline or linked
      /<img[^>]*src=["']([^"']+\.svg)["']/i,
      
      // Brand/site-logo class patterns
      /<img[^>]*(?:class|id)=["'][^"']*(?:brand|site-logo|header-logo|navbar-brand)[^"']*["'][^>]*src=["']([^"']+)["']/i,
      
      // Logo in anchor with class
      /<a[^>]*(?:class|id)=["'][^"']*logo[^"']*["'][^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["']/i,
    ];

    let foundLogos: string[] = [];

    for (const pattern of logoPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        let logoUrl = match[1];
        
        // Convert relative URLs to absolute
        if (logoUrl.startsWith("//")) {
          logoUrl = "https:" + logoUrl;
        } else if (logoUrl.startsWith("/")) {
          logoUrl = baseUrl.origin + logoUrl;
        } else if (!logoUrl.startsWith("http")) {
          logoUrl = baseUrl.origin + "/" + logoUrl;
        }
        
        // Skip data URIs and very small icons
        if (!logoUrl.startsWith("data:") && !logoUrl.includes("favicon.ico")) {
          foundLogos.push(logoUrl);
        }
      }
    }

    // Remove duplicates
    foundLogos = [...new Set(foundLogos)];

    // Prioritize: OG image > Twitter > SVG > other images
    const prioritized = foundLogos.sort((a, b) => {
      const scoreA = a.includes(".svg") ? 3 : (a.includes("og") || a.includes("share")) ? 2 : 1;
      const scoreB = b.includes(".svg") ? 3 : (b.includes("og") || b.includes("share")) ? 2 : 1;
      return scoreB - scoreA;
    });

    console.log(`Found ${prioritized.length} potential logos:`, prioritized.slice(0, 5));

    // Validate the top logo URL is accessible
    let validLogo = null;
    for (const logoUrl of prioritized.slice(0, 5)) {
      try {
        const logoResponse = await fetch(logoUrl, { method: "HEAD" });
        const contentType = logoResponse.headers.get("content-type") || "";
        if (logoResponse.ok && (contentType.includes("image") || logoUrl.endsWith(".svg"))) {
          validLogo = logoUrl;
          break;
        }
      } catch (e) {
        console.log(`Failed to validate logo: ${logoUrl}`);
      }
    }

    return new Response(
      JSON.stringify({
        logo_url: validLogo,
        all_candidates: prioritized.slice(0, 5),
        source_url: url,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error fetching logo:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
