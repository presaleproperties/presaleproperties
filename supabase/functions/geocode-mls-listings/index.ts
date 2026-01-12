import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!GOOGLE_MAPS_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Google Maps API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request body for options
    let batchSize = 50; // Process 50 at a time to avoid rate limits
    let onlyMissing = true; // Only geocode listings missing coordinates
    let city: string | null = null;
    
    try {
      const body = await req.json();
      if (body?.batchSize) batchSize = Math.min(parseInt(body.batchSize) || 50, 100);
      if (body?.onlyMissing !== undefined) onlyMissing = body.onlyMissing;
      if (body?.city) city = body.city;
    } catch {
      // No body or invalid JSON
    }

    console.log(`Geocoding MLS listings: batchSize=${batchSize}, onlyMissing=${onlyMissing}, city=${city || 'all'}`);

    // Build query for listings that need geocoding
    let query = supabase
      .from("mls_listings")
      .select("id, listing_key, unparsed_address, street_number, street_name, street_suffix, unit_number, city, postal_code, latitude, longitude")
      .eq("mls_status", "Active");
    
    if (onlyMissing) {
      query = query.or("latitude.is.null,longitude.is.null");
    }
    
    if (city) {
      query = query.ilike("city", city);
    }
    
    const { data: listings, error: fetchError } = await query.limit(batchSize);

    if (fetchError) {
      console.error("Error fetching listings:", fetchError);
      throw fetchError;
    }

    if (!listings || listings.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No listings need geocoding",
          processed: 0,
          updated: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${listings.length} listings to geocode`);

    let updated = 0;
    let errors = 0;

    for (const listing of listings) {
      // Build address for geocoding
      const addressParts = [];
      if (listing.unit_number) addressParts.push(`#${listing.unit_number}`);
      if (listing.street_number) addressParts.push(listing.street_number);
      if (listing.street_name) addressParts.push(listing.street_name);
      if (listing.street_suffix) addressParts.push(listing.street_suffix);
      
      let address = addressParts.length > 0 
        ? addressParts.join(" ") 
        : listing.unparsed_address;
      
      if (!address) {
        console.log(`Skipping listing ${listing.listing_key}: no address`);
        continue;
      }

      // Add city and province for better accuracy
      address = `${address}, ${listing.city}, BC, Canada`;
      if (listing.postal_code) {
        address = `${address} ${listing.postal_code}`;
      }

      try {
        // Call Google Geocoding API
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`
        );

        if (!response.ok) {
          console.error(`Geocoding API error for ${listing.listing_key}: ${response.status}`);
          errors++;
          continue;
        }

        const data = await response.json();

        if (data.status !== "OK" || !data.results?.[0]) {
          console.log(`No geocoding results for ${listing.listing_key}: ${address}`);
          errors++;
          continue;
        }

        const location = data.results[0].geometry?.location;
        
        if (!location?.lat || !location?.lng) {
          console.log(`No coordinates in result for ${listing.listing_key}`);
          errors++;
          continue;
        }

        // Update the listing with new coordinates
        const { error: updateError } = await supabase
          .from("mls_listings")
          .update({
            latitude: location.lat,
            longitude: location.lng,
            last_synced_at: new Date().toISOString(),
          })
          .eq("id", listing.id);

        if (updateError) {
          console.error(`Error updating listing ${listing.listing_key}:`, updateError);
          errors++;
        } else {
          console.log(`Updated ${listing.listing_key}: ${location.lat}, ${location.lng}`);
          updated++;
        }

        // Rate limit: 50 requests per second max, but let's be conservative
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (err) {
        console.error(`Error geocoding ${listing.listing_key}:`, err);
        errors++;
      }
    }

    console.log(`Geocoding complete: ${updated} updated, ${errors} errors`);

    // Get remaining count
    let remainingQuery = supabase
      .from("mls_listings")
      .select("id", { count: "exact", head: true })
      .eq("mls_status", "Active")
      .or("latitude.is.null,longitude.is.null");
    
    if (city) {
      remainingQuery = remainingQuery.ilike("city", city);
    }
    
    const { count: remaining } = await remainingQuery;

    return new Response(
      JSON.stringify({
        success: true,
        processed: listings.length,
        updated,
        errors,
        remaining: remaining || 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Geocoding error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});