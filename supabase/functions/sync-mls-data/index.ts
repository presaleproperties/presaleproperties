import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DDFProperty {
  PropertyKey: string;
  ListingKey: string;
  ListingId: string;
  ListPrice: number;
  StandardStatus: string;
  MlsStatus: string;
  PropertyType: string;
  PropertySubType?: string;
  City: string;
  StateOrProvince?: string;
  PostalCode?: string;
  StreetNumber?: string;
  StreetName?: string;
  StreetSuffix?: string;
  UnitNumber?: string;
  UnparsedAddress?: string;
  BedroomsTotal?: number;
  BathroomsTotalInteger?: number;
  BathroomsFull?: number;
  BathroomsHalf?: number;
  LivingArea?: number;
  LivingAreaUnits?: string;
  LotSizeArea?: number;
  LotSizeUnits?: string;
  YearBuilt?: number;
  Stories?: number;
  GarageSpaces?: number;
  ParkingTotal?: number;
  Latitude?: number;
  Longitude?: number;
  PublicRemarks?: string;
  PrivateRemarks?: string;
  Directions?: string;
  ListAgentKey?: string;
  ListAgentMlsId?: string;
  ListAgentFullName?: string;
  ListAgentEmail?: string;
  ListAgentDirectPhone?: string;
  ListOfficeKey?: string;
  ListOfficeMlsId?: string;
  ListOfficeName?: string;
  ListOfficePhone?: string;
  BuyerAgentKey?: string;
  BuyerAgentFullName?: string;
  BuyerOfficeName?: string;
  OriginalListPrice?: number;
  ClosePrice?: number;
  CloseDate?: string;
  ListingContractDate?: string;
  OnMarketDate?: string;
  ExpirationDate?: string;
  DaysOnMarket?: number;
  CumulativeDaysOnMarket?: number;
  ModificationTimestamp?: string;
  PhotosChangeTimestamp?: string;
  AssociationFee?: number;
  AssociationFeeFrequency?: string;
  TaxAnnualAmount?: number;
  TaxYear?: number;
  Cooling?: string[];
  Heating?: string[];
  InteriorFeatures?: string[];
  ExteriorFeatures?: string[];
  CommunityFeatures?: string[];
  Appliances?: string[];
  View?: string[];
  PoolPrivateYN?: boolean;
  WaterfrontYN?: boolean;
  SubdivisionName?: string;
  Neighborhood?: string;
  VirtualTourURLUnbranded?: string;
  VideoURL?: string;
  Media?: Array<{
    MediaURL: string;
    MediaCategory: string;
    Order: number;
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
    let maxRecords = 100; // Start small for testing
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
    
    // Build OData query
    let queryParams = [`$top=${maxRecords}`];
    
    // Filter for active listings
    queryParams.push("$filter=StandardStatus eq 'Active'");
    
    // Add city filter if specified
    if (filterCity) {
      queryParams[1] = `$filter=StandardStatus eq 'Active' and contains(City,'${filterCity}')`;
    }
    
    // Select specific fields to reduce payload
    queryParams.push("$select=PropertyKey,ListingKey,ListingId,ListPrice,StandardStatus,MlsStatus,PropertyType,PropertySubType,City,StateOrProvince,PostalCode,StreetNumber,StreetName,StreetSuffix,UnitNumber,UnparsedAddress,BedroomsTotal,BathroomsTotalInteger,BathroomsFull,BathroomsHalf,LivingArea,LivingAreaUnits,LotSizeArea,LotSizeUnits,YearBuilt,Stories,GarageSpaces,ParkingTotal,Latitude,Longitude,PublicRemarks,Directions,ListAgentKey,ListAgentMlsId,ListAgentFullName,ListAgentEmail,ListAgentDirectPhone,ListOfficeKey,ListOfficeMlsId,ListOfficeName,ListOfficePhone,OriginalListPrice,ClosePrice,CloseDate,ListingContractDate,OnMarketDate,ExpirationDate,DaysOnMarket,CumulativeDaysOnMarket,ModificationTimestamp,PhotosChangeTimestamp,AssociationFee,AssociationFeeFrequency,TaxAnnualAmount,TaxYear,SubdivisionName,Neighborhood,VirtualTourURLUnbranded,VideoURL,Media");

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

    console.log(`Fetched ${properties.length} properties from DDF`);

    let created = 0;
    let updated = 0;
    let errors = 0;

    // Process each property
    for (const property of properties) {
      try {
        // Transform DDF property to our schema
        const mlsListing = {
          listing_key: property.ListingKey || property.PropertyKey,
          listing_id: property.ListingId,
          listing_price: property.ListPrice,
          mls_status: property.MlsStatus || "Active",
          standard_status: property.StandardStatus,
          property_type: property.PropertyType || "Residential",
          property_sub_type: property.PropertySubType,
          city: property.City,
          state_or_province: property.StateOrProvince || "BC",
          postal_code: property.PostalCode,
          street_number: property.StreetNumber,
          street_name: property.StreetName,
          street_suffix: property.StreetSuffix,
          unit_number: property.UnitNumber,
          unparsed_address: property.UnparsedAddress,
          bedrooms_total: property.BedroomsTotal,
          bathrooms_total: property.BathroomsTotalInteger,
          bathrooms_full: property.BathroomsFull,
          bathrooms_half: property.BathroomsHalf,
          living_area: property.LivingArea,
          living_area_units: property.LivingAreaUnits || "sqft",
          lot_size_area: property.LotSizeArea,
          lot_size_units: property.LotSizeUnits,
          year_built: property.YearBuilt,
          stories: property.Stories,
          garage_spaces: property.GarageSpaces,
          parking_total: property.ParkingTotal,
          latitude: property.Latitude,
          longitude: property.Longitude,
          public_remarks: property.PublicRemarks,
          directions: property.Directions,
          list_agent_key: property.ListAgentKey,
          list_agent_mls_id: property.ListAgentMlsId,
          list_agent_name: property.ListAgentFullName,
          list_agent_email: property.ListAgentEmail,
          list_agent_phone: property.ListAgentDirectPhone,
          list_office_key: property.ListOfficeKey,
          list_office_mls_id: property.ListOfficeMlsId,
          list_office_name: property.ListOfficeName,
          list_office_phone: property.ListOfficePhone,
          original_list_price: property.OriginalListPrice,
          close_price: property.ClosePrice,
          close_date: property.CloseDate,
          listing_contract_date: property.ListingContractDate,
          list_date: property.OnMarketDate,
          expiration_date: property.ExpirationDate,
          days_on_market: property.DaysOnMarket,
          cumulative_days_on_market: property.CumulativeDaysOnMarket,
          modification_timestamp: property.ModificationTimestamp,
          photos_change_timestamp: property.PhotosChangeTimestamp,
          association_fee: property.AssociationFee,
          association_fee_frequency: property.AssociationFeeFrequency,
          tax_annual_amount: property.TaxAnnualAmount,
          tax_year: property.TaxYear,
          subdivision_name: property.SubdivisionName,
          neighborhood: property.Neighborhood,
          virtual_tour_url: property.VirtualTourURLUnbranded,
          video_url: property.VideoURL,
          photos: property.Media ? property.Media.filter(m => m.MediaCategory === "Photo").map(m => ({
            url: m.MediaURL,
            order: m.Order,
          })) : null,
          last_synced_at: new Date().toISOString(),
        };

        // Upsert listing
        const { error: upsertError } = await supabase
          .from("mls_listings")
          .upsert(mlsListing, { onConflict: "listing_key" });

        if (upsertError) {
          console.error(`Error upserting listing ${property.ListingKey}:`, upsertError);
          errors++;
        } else {
          // Check if it was created or updated
          const { data: existing } = await supabase
            .from("mls_listings")
            .select("created_at, updated_at")
            .eq("listing_key", property.ListingKey || property.PropertyKey)
            .single();

          if (existing && existing.created_at === existing.updated_at) {
            created++;
          } else {
            updated++;
          }
        }
      } catch (err) {
        console.error(`Error processing property ${property.ListingKey}:`, err);
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
