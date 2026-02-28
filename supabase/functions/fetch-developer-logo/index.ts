import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://presaleproperties.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Try multiple user agents to avoid bot detection
const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
];

async function tryFetch(url: string): Promise<Response | null> {
  for (const userAgent of userAgents) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": userAgent,
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Sec-Fetch-User": "?1",
          "Upgrade-Insecure-Requests": "1",
        },
        redirect: "follow",
      });

      if (response.ok) {
        return response;
      }
    } catch (e) {
      console.log(`Fetch failed with UA: ${userAgent.substring(0, 30)}...`);
    }
  }
  return null;
}

function extractLogosFromHtml(html: string, baseUrl: URL): string[] {
  const logoPatterns = [
    // Open Graph image
    /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/gi,
    /<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/gi,
    
    // Twitter card
    /<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/gi,
    /<meta\s+content=["']([^"']+)["']\s+name=["']twitter:image["']/gi,
    
    // Apple touch icon (usually high-res logo)
    /<link\s+rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/gi,
    /<link[^>]*href=["']([^"']+)["'][^>]*rel=["']apple-touch-icon["']/gi,
    
    // Logo in img tags
    /<img[^>]*(?:class|id)=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/gi,
    /<img[^>]*src=["']([^"']+)["'][^>]*(?:class|id)=["'][^"']*logo[^"']*["']/gi,
    /<img[^>]*alt=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/gi,
    
    // SVG logos
    /<img[^>]*src=["']([^"']+\.svg)["']/gi,
    
    // Brand patterns
    /<img[^>]*(?:class|id)=["'][^"']*(?:brand|site-logo|header-logo|navbar-brand)[^"']*["'][^>]*src=["']([^"']+)["']/gi,
    
    // Header images
    /<header[^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["']/gi,
  ];

  const foundLogos: string[] = [];

  for (const pattern of logoPatterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      let logoUrl = match[1];
      
      // Convert relative URLs to absolute
      if (logoUrl.startsWith("//")) {
        logoUrl = "https:" + logoUrl;
      } else if (logoUrl.startsWith("/")) {
        logoUrl = baseUrl.origin + logoUrl;
      } else if (!logoUrl.startsWith("http")) {
        logoUrl = baseUrl.origin + "/" + logoUrl;
      }
      
      // Skip data URIs, tiny favicons, and tracking pixels
      if (
        !logoUrl.startsWith("data:") && 
        !logoUrl.includes("favicon.ico") &&
        !logoUrl.includes("1x1") &&
        !logoUrl.includes("pixel")
      ) {
        foundLogos.push(logoUrl);
      }
    }
  }

  return [...new Set(foundLogos)];
}

async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { 
      method: "HEAD",
      headers: {
        "User-Agent": userAgents[0],
      }
    });
    const contentType = response.headers.get("content-type") || "";
    return response.ok && (
      contentType.includes("image") || 
      url.endsWith(".svg") || 
      url.endsWith(".png") || 
      url.endsWith(".jpg") ||
      url.endsWith(".webp")
    );
  } catch {
    return false;
  }
}

// Try to construct common logo URL patterns
function generateCommonLogoPaths(baseUrl: URL): string[] {
  const origin = baseUrl.origin;
  return [
    `${origin}/logo.png`,
    `${origin}/logo.svg`,
    `${origin}/images/logo.png`,
    `${origin}/images/logo.svg`,
    `${origin}/img/logo.png`,
    `${origin}/img/logo.svg`,
    `${origin}/assets/logo.png`,
    `${origin}/assets/logo.svg`,
    `${origin}/assets/images/logo.png`,
    `${origin}/wp-content/uploads/logo.png`,
    `${origin}/apple-touch-icon.png`,
    `${origin}/apple-touch-icon-precomposed.png`,
  ];
}

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
    const baseUrl = new URL(url);

    let foundLogos: string[] = [];

    // Method 1: Try to fetch the webpage and parse HTML
    const response = await tryFetch(url);
    
    if (response) {
      const html = await response.text();
      foundLogos = extractLogosFromHtml(html, baseUrl);
      console.log(`Found ${foundLogos.length} logos from HTML parsing`);
    } else {
      console.log("Direct fetch failed, trying common paths...");
    }

    // Method 2: Try common logo paths if HTML parsing didn't find much
    if (foundLogos.length < 2) {
      const commonPaths = generateCommonLogoPaths(baseUrl);
      for (const path of commonPaths) {
        if (await validateImageUrl(path)) {
          foundLogos.unshift(path); // Add to front as these are likely actual logos
          console.log(`Found logo at common path: ${path}`);
          break; // One good common path is enough
        }
      }
    }

    // Prioritize: SVG > PNG > common paths > other
    const prioritized = foundLogos.sort((a, b) => {
      const scoreA = a.includes(".svg") ? 4 : a.includes("apple-touch") ? 3 : a.includes("logo") ? 2 : 1;
      const scoreB = b.includes(".svg") ? 4 : b.includes("apple-touch") ? 3 : b.includes("logo") ? 2 : 1;
      return scoreB - scoreA;
    });

    // Validate top candidates
    let validLogo = null;
    for (const logoUrl of prioritized.slice(0, 8)) {
      if (await validateImageUrl(logoUrl)) {
        validLogo = logoUrl;
        console.log(`Validated logo: ${logoUrl}`);
        break;
      }
    }

    return new Response(
      JSON.stringify({
        logo_url: validLogo,
        all_candidates: prioritized.slice(0, 5),
        source_url: url,
        method: response ? "html_parsing" : "common_paths",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error fetching logo:", error);
    return new Response(
      JSON.stringify({ error: error.message, logo_url: null }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
