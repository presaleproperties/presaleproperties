/**
 * Scrape REW.ca Rentals
 * Scrapes rental listings from REW.ca and matches them to MLS listings by address/MLS#
 * Uses Firecrawl for web scraping with AI extraction
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface REWListing {
  address: string;
  price: number;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  mlsNumber: string | null;
  city: string;
  propertyType: string | null;
  url: string;
}

interface ScrapeResult {
  success: boolean;
  listingsScraped: number;
  listingsMatched: number;
  listingsUpdated: number;
  errors: string[];
}

// Cities to scrape - focus on Metro Vancouver
const CITIES_TO_SCRAPE = [
  "vancouver",
  "burnaby", 
  "richmond",
  "surrey",
  "coquitlam",
  "new-westminster",
  "north-vancouver",
  "west-vancouver",
  "port-coquitlam",
  "port-moody",
  "langley",
  "delta",
  "white-rock",
];

// Property types on REW
const PROPERTY_TYPES = ["apartment-condo", "townhouse"];

// Map city slug to proper name
const CITY_MAP: Record<string, string> = {
  "vancouver": "Vancouver",
  "burnaby": "Burnaby",
  "richmond": "Richmond",
  "surrey": "Surrey",
  "coquitlam": "Coquitlam",
  "new-westminster": "New Westminster",
  "north-vancouver": "North Vancouver",
  "west-vancouver": "West Vancouver",
  "port-coquitlam": "Port Coquitlam",
  "port-moody": "Port Moody",
  "langley": "Langley",
  "delta": "Delta",
  "maple-ridge": "Maple Ridge",
  "white-rock": "White Rock",
  "abbotsford": "Abbotsford",
  "chilliwack": "Chilliwack",
};

// Normalize address for matching
function normalizeAddress(address: string): string {
  return address
    .toLowerCase()
    .replace(/[,#\-\.]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b(street|st|avenue|ave|road|rd|drive|dr|boulevard|blvd|way|place|pl|court|ct|crescent|cres|lane|ln)\b/gi, '')
    .replace(/\b(unit|suite|apt|apartment|#)\s*\d+/gi, '')
    .trim();
}

// Extract price from various formats
function parsePrice(priceStr: string): number | null {
  if (!priceStr) return null;
  const cleaned = priceStr.replace(/[^0-9]/g, '');
  const price = parseInt(cleaned, 10);
  if (price >= 500 && price <= 25000) return price;
  return null;
}

// Scrape listings using Firecrawl with AI extraction
async function scrapeREWListings(
  firecrawlApiKey: string,
  city: string,
  propertyType: string,
  page: number = 1
): Promise<REWListing[]> {
  const url = `https://www.rew.ca/properties/areas/bc-${city}/type/residential-rental/sub-type/${propertyType}/page/${page}`;
  
  console.log(`Scraping: ${url}`);

  // Use Firecrawl with JSON extraction for structured data
  const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${firecrawlApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats: [
        "markdown",
        {
          type: "json",
          prompt: `Extract all rental property listings from this REW.ca page. For each listing, extract:
- address: Full street address including unit number
- price: Monthly rent price in dollars (just the number, e.g. 2500)
- bedrooms: Number of bedrooms (0 for studio)
- bathrooms: Number of bathrooms
- sqft: Square footage if available
- mlsNumber: MLS listing number if shown (format like R1234567 or just numbers)

Return as an array of objects with these fields.`,
          schema: {
            type: "array",
            items: {
              type: "object",
              properties: {
                address: { type: "string" },
                price: { type: "number" },
                bedrooms: { type: "number" },
                bathrooms: { type: "number" },
                sqft: { type: "number" },
                mlsNumber: { type: "string" },
              },
              required: ["address", "price"]
            }
          }
        }
      ],
      onlyMainContent: true,
      waitFor: 3000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Firecrawl error for ${url}:`, errorText);
    return [];
  }

  const result = await response.json();
  
  // Try to get structured JSON data first
  let listings: REWListing[] = [];
  
  if (result.data?.json && Array.isArray(result.data.json)) {
    console.log(`Got ${result.data.json.length} listings via JSON extraction`);
    listings = result.data.json
      .filter((item: any) => item.address && item.price)
      .map((item: any) => ({
        address: item.address,
        price: typeof item.price === 'number' ? item.price : parsePrice(String(item.price)) || 0,
        bedrooms: item.bedrooms ?? null,
        bathrooms: item.bathrooms ?? null,
        sqft: item.sqft ?? null,
        mlsNumber: item.mlsNumber || null,
        city: CITY_MAP[city] || city,
        propertyType: propertyType === "apartment-condo" ? "Apartment/Condo" : "Townhouse",
        url,
      }))
      .filter((l: REWListing) => l.price >= 500 && l.price <= 25000);
  } else {
    // Fallback: Parse from markdown
    const markdown = result.data?.markdown || "";
    console.log(`Parsing from markdown (${markdown.length} chars)`);
    
    // Pattern to find listings: typically formatted as price followed by details
    const pricePattern = /\$(\d{1,2}[,.]?\d{3})\s*(?:\/\s*mo(?:nth)?)?/gi;
    const addressPattern = /(\d+[^,\n]{5,50}(?:Vancouver|Burnaby|Richmond|Surrey|Coquitlam|New Westminster|North Vancouver|West Vancouver|Port Coquitlam|Port Moody|Langley|Delta|White Rock)[^,\n]*)/gi;
    
    const prices = [...markdown.matchAll(pricePattern)];
    const addresses = [...markdown.matchAll(addressPattern)];
    
    // Match prices to nearby addresses
    const minLen = Math.min(prices.length, addresses.length);
    for (let i = 0; i < minLen; i++) {
      const price = parsePrice(prices[i][1]);
      if (!price) continue;
      
      listings.push({
        address: addresses[i][1].trim(),
        price,
        bedrooms: null,
        bathrooms: null,
        sqft: null,
        mlsNumber: null,
        city: CITY_MAP[city] || city,
        propertyType: propertyType === "apartment-condo" ? "Apartment/Condo" : "Townhouse",
        url,
      });
    }
  }

  console.log(`Found ${listings.length} valid listings from ${url}`);
  return listings;
}

// Match scraped listing to MLS database and update
async function matchAndUpdateListing(
  supabase: any,
  rewListing: REWListing
): Promise<boolean> {
  // Strategy 1: Match by MLS number if available
  if (rewListing.mlsNumber) {
    const mlsNum = rewListing.mlsNumber.replace(/[^A-Z0-9]/gi, '');
    
    const { data: mlsMatch } = await supabase
      .from("mls_listings")
      .select("id, listing_id, listing_key, lease_amount")
      .or(`listing_id.ilike.%${mlsNum}%,listing_key.ilike.%${mlsNum}%`)
      .eq("mls_status", "Active")
      .eq("city", rewListing.city)
      .limit(1)
      .maybeSingle();

    if (mlsMatch) {
      if (!mlsMatch.lease_amount || mlsMatch.lease_amount === 0) {
        const { error: updateError } = await supabase
          .from("mls_listings")
          .update({
            lease_amount: rewListing.price,
            lease_frequency: "Monthly",
            is_rental: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", mlsMatch.id);

        if (!updateError) {
          console.log(`Updated MLS ${rewListing.mlsNumber} with rent $${rewListing.price}`);
          return true;
        }
      }
      return false;
    }
  }

  // Strategy 2: Match by normalized address
  const normalizedREWAddress = normalizeAddress(rewListing.address);
  
  // Get listings in the same city that need rent data
  const { data: cityListings } = await supabase
    .from("mls_listings")
    .select("id, listing_id, unparsed_address, street_number, street_name, unit_number, lease_amount, bedrooms_total")
    .eq("city", rewListing.city)
    .eq("mls_status", "Active")
    .or("lease_amount.is.null,lease_amount.eq.0")
    .limit(300);

  if (!cityListings || cityListings.length === 0) return false;

  for (const listing of cityListings) {
    const listingAddress = listing.unparsed_address || 
      `${listing.unit_number || ''} ${listing.street_number || ''} ${listing.street_name || ''}`;
    
    const normalizedListingAddress = normalizeAddress(listingAddress);
    
    // Check for significant overlap in address tokens
    const rewTokens = normalizedREWAddress.split(' ').filter(t => t.length > 2);
    const listingTokens = normalizedListingAddress.split(' ').filter(t => t.length > 2);
    
    const matchingTokens = rewTokens.filter(t => listingTokens.includes(t));
    const matchRatio = matchingTokens.length / Math.max(rewTokens.length, listingTokens.length);
    
    // Require at least 60% token match
    if (matchRatio >= 0.6) {
      // Additional validation: bedrooms should match if both available
      if (rewListing.bedrooms !== null && listing.bedrooms_total !== null) {
        if (rewListing.bedrooms !== listing.bedrooms_total) {
          continue;
        }
      }

      const { error: updateError } = await supabase
        .from("mls_listings")
        .update({
          lease_amount: rewListing.price,
          lease_frequency: "Monthly",
          is_rental: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", listing.id);

      if (!updateError) {
        console.log(`Updated listing ${listing.listing_id} with rent $${rewListing.price} (address match: ${matchRatio.toFixed(2)})`);
        return true;
      }
    }
  }

  return false;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!firecrawlApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Firecrawl API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request body for options
    let cities = CITIES_TO_SCRAPE;
    let maxPagesPerCity = 3;
    let propertyTypes = PROPERTY_TYPES;
    
    try {
      const body = await req.json();
      if (body?.cities && Array.isArray(body.cities)) {
        cities = body.cities;
      }
      if (body?.maxPages) {
        maxPagesPerCity = Math.min(parseInt(body.maxPages) || 3, 10);
      }
      if (body?.propertyTypes && Array.isArray(body.propertyTypes)) {
        propertyTypes = body.propertyTypes;
      }
    } catch {
      // Use defaults
    }

    console.log(`Starting REW.ca rental scrape for ${cities.length} cities, ${maxPagesPerCity} pages each`);

    const result: ScrapeResult = {
      success: true,
      listingsScraped: 0,
      listingsMatched: 0,
      listingsUpdated: 0,
      errors: [],
    };

    const allListings: REWListing[] = [];

    // Scrape each city and property type
    for (const city of cities) {
      for (const propertyType of propertyTypes) {
        try {
          for (let page = 1; page <= maxPagesPerCity; page++) {
            const listings = await scrapeREWListings(
              firecrawlApiKey,
              city,
              propertyType,
              page
            );
            
            allListings.push(...listings);
            result.listingsScraped += listings.length;

            // If we got fewer than expected, no more pages
            if (listings.length < 10) break;
            
            // Rate limiting - wait between requests
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
        } catch (error) {
          const errorMsg = `Error scraping ${city}/${propertyType}: ${error instanceof Error ? error.message : "Unknown error"}`;
          console.error(errorMsg);
          result.errors.push(errorMsg);
        }
      }
    }

    console.log(`Scraped ${allListings.length} total listings, now matching to MLS database...`);

    // Match and update listings
    for (const listing of allListings) {
      try {
        result.listingsMatched++;
        const updated = await matchAndUpdateListing(supabase, listing);
        if (updated) {
          result.listingsUpdated++;
        }
      } catch (error) {
        console.error(`Error matching listing:`, error);
      }
    }

    console.log(`Scrape complete: ${result.listingsScraped} scraped, ${result.listingsUpdated} MLS listings updated with rent prices`);

    // Log the scrape result
    await supabase.from("mls_sync_logs").insert({
      sync_type: "rew_scrape",
      status: "completed",
      listings_processed: result.listingsScraped,
      listings_updated: result.listingsUpdated,
      error_message: result.errors.length > 0 ? result.errors.join("; ") : null,
    });

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("REW scrape error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
