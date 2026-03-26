import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://presaleproperties.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CityPriceSqft {
  city: string;
  property_type: 'condo' | 'townhome';
  avg_price_sqft: number;
  listing_count: number;
  avg_price: number;
  avg_sqft: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting price/sqft calculation from MLS data...');

    // Get current year and calculate cutoff for "under 1 year old"
    const currentYear = new Date().getFullYear();
    const cutoffYear = currentYear - 1; // Properties built in current year or last year

    // Query MLS listings for new construction with valid data
    // Separate condos (Apartment/Condo) from townhomes
    const { data: mlsData, error: mlsError } = await supabase
      .from('mls_listings')
      .select('city, property_sub_type, listing_price, living_area')
      .gte('year_built', cutoffYear)
      .gt('living_area', 200) // Filter out unrealistic sqft
      .lt('living_area', 5000) // Filter out unrealistic sqft
      .gt('listing_price', 100000) // Filter out unrealistic prices
      .eq('mls_status', 'Active');

    if (mlsError) {
      throw new Error(`Failed to fetch MLS data: ${mlsError.message}`);
    }

    console.log(`Found ${mlsData?.length || 0} new construction listings`);

    if (!mlsData || mlsData.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No new construction listings found', updated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Categorize listings and calculate price/sqft
    const cityStats: Map<string, { condo: number[], townhome: number[] }> = new Map();

    for (const listing of mlsData) {
      if (!listing.city || !listing.living_area || !listing.listing_price) continue;

      const city = listing.city.trim();
      const priceSqft = listing.listing_price / listing.living_area;
      
      // Skip unrealistic values
      if (priceSqft < 200 || priceSqft > 3000) continue;

      if (!cityStats.has(city)) {
        cityStats.set(city, { condo: [], townhome: [] });
      }

      const stats = cityStats.get(city)!;
      
      // Categorize by property sub type
      const subType = listing.property_sub_type?.toLowerCase() || '';
      
      if (subType.includes('townhouse') || subType.includes('row') || subType.includes('duplex') || subType.includes('triplex')) {
        stats.townhome.push(priceSqft);
      } else if (subType.includes('apartment') || subType.includes('condo') || subType.includes('strata')) {
        stats.condo.push(priceSqft);
      } else {
        // Default smaller units to condo, larger to townhome
        if (listing.living_area < 1200) {
          stats.condo.push(priceSqft);
        } else {
          stats.townhome.push(priceSqft);
        }
      }
    }

    console.log(`Calculated stats for ${cityStats.size} cities`);

    // Get current month/year for the report
    const now = new Date();
    const reportMonth = now.getMonth() + 1;
    const reportYear = now.getFullYear();

    let updatedCount = 0;
    const results: CityPriceSqft[] = [];

    // Update city_market_stats for each city/property_type combination
    for (const [city, stats] of cityStats.entries()) {
      // Update condo stats if we have data
      if (stats.condo.length >= 3) { // Minimum 3 listings for statistical validity
        const avgPriceSqft = Math.round(stats.condo.reduce((a, b) => a + b, 0) / stats.condo.length);
        
        results.push({
          city,
          property_type: 'condo',
          avg_price_sqft: avgPriceSqft,
          listing_count: stats.condo.length,
          avg_price: 0,
          avg_sqft: 0
        });

        // Upsert to city_market_stats
        const { error: upsertError } = await supabase
          .from('city_market_stats')
          .upsert({
            city,
            property_type: 'condo',
            report_month: reportMonth,
            report_year: reportYear,
            avg_price_sqft: avgPriceSqft,
            source_board: 'MLS New Construction',
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'city,property_type,report_month,report_year'
          });

        if (upsertError) {
          console.error(`Failed to update condo stats for ${city}:`, upsertError);
        } else {
          updatedCount++;
          console.log(`Updated ${city} condo: $${avgPriceSqft}/sqft (${stats.condo.length} listings)`);
        }
      }

      // Update townhome stats if we have data
      if (stats.townhome.length >= 3) {
        const avgPriceSqft = Math.round(stats.townhome.reduce((a, b) => a + b, 0) / stats.townhome.length);
        
        results.push({
          city,
          property_type: 'townhome',
          avg_price_sqft: avgPriceSqft,
          listing_count: stats.townhome.length,
          avg_price: 0,
          avg_sqft: 0
        });

        const { error: upsertError } = await supabase
          .from('city_market_stats')
          .upsert({
            city,
            property_type: 'townhome',
            report_month: reportMonth,
            report_year: reportYear,
            avg_price_sqft: avgPriceSqft,
            source_board: 'MLS New Construction',
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'city,property_type,report_month,report_year'
          });

        if (upsertError) {
          console.error(`Failed to update townhome stats for ${city}:`, upsertError);
        } else {
          updatedCount++;
          console.log(`Updated ${city} townhome: $${avgPriceSqft}/sqft (${stats.townhome.length} listings)`);
        }
      }
    }

    console.log(`Successfully updated ${updatedCount} city/property_type combinations`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        updated: updatedCount,
        results: results.sort((a, b) => b.listing_count - a.listing_count)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error calculating price/sqft:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
