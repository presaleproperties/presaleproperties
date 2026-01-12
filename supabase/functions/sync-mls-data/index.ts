import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// DDF API response structure - using correct CREA DDF field names from documentation
interface DDFProperty {
  ListingKey?: string;
  ListingId?: string;
  ListPrice?: number;
  StandardStatus?: string;
  PropertySubType?: string;
  City?: string;
  StateOrProvince?: string;
  PostalCode?: string;
  UnparsedAddress?: string;
  StreetNumber?: string;
  StreetName?: string;
  UnitNumber?: string;
  BedroomsTotal?: number;
  BathroomsTotalInteger?: number;
  LivingArea?: number;
  LivingAreaUnits?: string;
  YearBuilt?: number;
  Latitude?: number;
  Longitude?: number;
  PublicRemarks?: string;
  ListAgentKey?: string;
  ListOfficeKey?: string;
  OriginalEntryTimestamp?: string;
  ModificationTimestamp?: string;
  PhotosCount?: number;
  Media?: Array<{
    MediaURL: string;
    MediaCategory?: string;
    Order?: number;
  }>;
}

async function getAccessToken(clientId: string, clientSecret: string): Promise<string> {
  const tokenUrl = "https://identity.crea.ca/connect/token";
  
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope: "DDFApi_Read",
  });

  console.log("Requesting access token from CREA Identity Server...");
  
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Token request failed:", response.status, errorText);
    throw new Error(`Failed to get access token: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log("Access token obtained successfully, expires in:", data.expires_in, "seconds");
  return data.access_token;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const DDF_USERNAME = Deno.env.get("DDF_USERNAME");
    const DDF_PASSWORD = Deno.env.get("DDF_PASSWORD");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!DDF_USERNAME || !DDF_PASSWORD) {
      throw new Error("DDF credentials not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request body for options
    let filterCity = "";
    let maxRecords = 100;
    try {
      const body = await req.json();
      if (body?.city) filterCity = body.city;
      if (body?.maxRecords) maxRecords = body.maxRecords;
    } catch {
      // No body or invalid JSON
    }

    // Log sync start
    const { data: syncLog, error: logError } = await supabase
      .from("mls_sync_logs")
      .insert({
        sync_type: filterCity ? `city:${filterCity}` : "full",
        status: "running",
      })
      .select()
      .single();

    if (logError) {
      console.error("Failed to create sync log:", logError);
    }

    const syncLogId = syncLog?.id;

    // Step 1: Get access token
    const accessToken = await getAccessToken(DDF_USERNAME, DDF_PASSWORD);

    // Step 2: Fetch properties from DDF API
    const apiBaseUrl = "https://ddfapi.realtor.ca/odata/v1/Property";
    
    // Build OData query - filter for BC listings using correct field names
    const queryParams = [`$top=${maxRecords}`];
    
    // Build filter for BC (using StateOrProvince), new construction (2024+), specific property types
    // Use correct CREA DDF field names from documentation
    const filters: string[] = [];
    
    // Filter by province - BC
    filters.push("StateOrProvince eq 'British Columbia'");
    
    // Filter by year built - 2024 and newer for new construction
    filters.push("YearBuilt ge 2024");
    
    // Add city filter if specified - target Vancouver, Surrey, Delta
    if (filterCity) {
      filters.push(`City eq '${filterCity}'`);
    } else {
      // Default to major Metro Vancouver cities
      filters.push("(City eq 'Vancouver' or City eq 'Surrey' or City eq 'Delta' or City eq 'Burnaby' or City eq 'Richmond' or City eq 'Coquitlam' or City eq 'Langley' or City eq 'Abbotsford' or City eq 'New Westminster' or City eq 'Port Moody' or City eq 'North Vancouver' or City eq 'West Vancouver')");
    }
    
    queryParams.push(`$filter=${filters.join(' and ')}`);
    
    // Order by newest first
    queryParams.push("$orderby=ListPrice desc");

    const apiUrl = `${apiBaseUrl}?${queryParams.join("&")}`;
    
    console.log("Fetching properties from DDF API:", apiUrl);

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("DDF API error:", response.status, errorText);
      
      if (syncLogId) {
        await supabase
          .from("mls_sync_logs")
          .update({
            status: "failed",
            error_message: `DDF API error: ${response.status} - ${errorText.substring(0, 500)}`,
            completed_at: new Date().toISOString(),
          })
          .eq("id", syncLogId);
      }

      throw new Error(`DDF API error: ${response.status}`);
    }

    const data = await response.json();
    const properties: DDFProperty[] = data.value || [];

    // Log first property to see available fields
    if (properties.length > 0) {
      console.log("Sample property fields:", Object.keys(properties[0]));
      console.log("Sample property:", JSON.stringify(properties[0]).substring(0, 1000));
    }

    console.log(`Fetched ${properties.length} properties from DDF`);

    let created = 0;
    let updated = 0;
    let errors = 0;

    // Process each property
    for (const property of properties) {
      try {
        // Transform DDF property to our schema - use correct DDF field names
        const listingKey = property.ListingKey || property.ListingId || `ddf-${Date.now()}-${Math.random()}`;
        
        const mlsListing = {
          listing_key: listingKey,
          listing_id: property.ListingId || listingKey,
          listing_price: property.ListPrice || 0,
          mls_status: property.StandardStatus || "Active",
          standard_status: property.StandardStatus || "Active",
          property_type: "Residential",
          property_sub_type: property.PropertySubType || null,
          city: property.City || "Unknown",
          state_or_province: property.StateOrProvince || "British Columbia",
          postal_code: property.PostalCode,
          unparsed_address: property.UnparsedAddress,
          street_number: property.StreetNumber,
          street_name: property.StreetName,
          unit_number: property.UnitNumber,
          bedrooms_total: property.BedroomsTotal,
          bathrooms_total: property.BathroomsTotalInteger,
          living_area: property.LivingArea,
          living_area_units: property.LivingAreaUnits || "sqft",
          year_built: property.YearBuilt,
          latitude: property.Latitude,
          longitude: property.Longitude,
          public_remarks: property.PublicRemarks,
          list_agent_key: property.ListAgentKey,
          list_office_key: property.ListOfficeKey,
          photos: property.Media ? property.Media.map(m => ({
            MediaURL: m.MediaURL,
            order: m.Order || 0,
          })) : null,
          list_date: property.OriginalEntryTimestamp ? new Date(property.OriginalEntryTimestamp).toISOString() : new Date().toISOString(),
          modification_timestamp: property.ModificationTimestamp,
          last_synced_at: new Date().toISOString(),
        };

        // Upsert listing
        const { error: upsertError } = await supabase
          .from("mls_listings")
          .upsert(mlsListing, { onConflict: "listing_key" });

        if (upsertError) {
          console.error(`Error upserting listing ${listingKey}:`, upsertError);
          errors++;
        } else {
          created++;
        }
      } catch (err) {
        console.error(`Error processing property:`, err);
        errors++;
      }
    }

    // Update sync log
    if (syncLogId) {
      await supabase
        .from("mls_sync_logs")
        .update({
          status: errors > 0 ? "completed_with_errors" : "completed",
          listings_fetched: properties.length,
          listings_created: created,
          listings_updated: updated,
          completed_at: new Date().toISOString(),
          error_message: errors > 0 ? `${errors} listings failed to process` : null,
        })
        .eq("id", syncLogId);
    }

    console.log(`Sync completed: ${created} created, ${updated} updated, ${errors} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        fetched: properties.length,
        created,
        updated,
        errors,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Sync error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
