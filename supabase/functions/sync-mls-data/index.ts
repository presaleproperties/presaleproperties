import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DDFListing {
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const DDF_USERNAME = Deno.env.get("DDF_USERNAME");
    const DDF_PASSWORD = Deno.env.get("DDF_PASSWORD");
    const DDF_FEED_URL = Deno.env.get("DDF_FEED_URL"); // Custom feed URL from CREA
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!DDF_USERNAME || !DDF_PASSWORD) {
      throw new Error("DDF credentials not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check for request body with custom URL (for testing)
    let apiUrl = DDF_FEED_URL;
    try {
      const body = await req.json();
      if (body?.feedUrl) {
        apiUrl = body.feedUrl;
      }
    } catch {
      // No body or invalid JSON, use default
    }

    // Default CREA DDF RESO Web API endpoint
    if (!apiUrl) {
      apiUrl = "https://data.crea.ca/Feed/Property";
    }

    // Log sync start
    const { data: syncLog, error: logError } = await supabase
      .from("mls_sync_logs")
      .insert({
        sync_type: "full",
        status: "running",
      })
      .select()
      .single();

    if (logError) {
      console.error("Failed to create sync log:", logError);
    }

    const syncLogId = syncLog?.id;

    // Create Basic Auth header
    const authHeader = btoa(`${DDF_USERNAME}:${DDF_PASSWORD}`);

    console.log("Fetching listings from DDF API:", apiUrl);

    // Fetch listings from DDF
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${authHeader}`,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("DDF API error:", response.status, errorText);
      
      // Update sync log with error
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
    const listings: DDFListing[] = data.value || data || [];

    console.log(`Fetched ${listings.length} listings from DDF`);

    let created = 0;
    let updated = 0;
    let errors = 0;

    // Process each listing
    for (const listing of listings) {
      try {
        // Transform DDF listing to our schema
        const mlsListing = {
          listing_key: listing.ListingKey,
          listing_id: listing.ListingId,
          listing_price: listing.ListPrice,
          mls_status: listing.MlsStatus || "Active",
          standard_status: listing.StandardStatus,
          property_type: listing.PropertyType || "Residential",
          property_sub_type: listing.PropertySubType,
          city: listing.City,
          state_or_province: listing.StateOrProvince || "BC",
          postal_code: listing.PostalCode,
          street_number: listing.StreetNumber,
          street_name: listing.StreetName,
          street_suffix: listing.StreetSuffix,
          unit_number: listing.UnitNumber,
          unparsed_address: listing.UnparsedAddress,
          bedrooms_total: listing.BedroomsTotal,
          bathrooms_total: listing.BathroomsTotalInteger,
          bathrooms_full: listing.BathroomsFull,
          bathrooms_half: listing.BathroomsHalf,
          living_area: listing.LivingArea,
          living_area_units: listing.LivingAreaUnits || "sqft",
          lot_size_area: listing.LotSizeArea,
          lot_size_units: listing.LotSizeUnits,
          year_built: listing.YearBuilt,
          stories: listing.Stories,
          garage_spaces: listing.GarageSpaces,
          parking_total: listing.ParkingTotal,
          latitude: listing.Latitude,
          longitude: listing.Longitude,
          public_remarks: listing.PublicRemarks,
          private_remarks: listing.PrivateRemarks,
          directions: listing.Directions,
          list_agent_key: listing.ListAgentKey,
          list_agent_mls_id: listing.ListAgentMlsId,
          list_agent_name: listing.ListAgentFullName,
          list_agent_email: listing.ListAgentEmail,
          list_agent_phone: listing.ListAgentDirectPhone,
          list_office_key: listing.ListOfficeKey,
          list_office_mls_id: listing.ListOfficeMlsId,
          list_office_name: listing.ListOfficeName,
          list_office_phone: listing.ListOfficePhone,
          buyer_agent_key: listing.BuyerAgentKey,
          buyer_agent_name: listing.BuyerAgentFullName,
          buyer_office_name: listing.BuyerOfficeName,
          original_list_price: listing.OriginalListPrice,
          close_price: listing.ClosePrice,
          close_date: listing.CloseDate,
          listing_contract_date: listing.ListingContractDate,
          list_date: listing.OnMarketDate,
          expiration_date: listing.ExpirationDate,
          days_on_market: listing.DaysOnMarket,
          cumulative_days_on_market: listing.CumulativeDaysOnMarket,
          modification_timestamp: listing.ModificationTimestamp,
          photos_change_timestamp: listing.PhotosChangeTimestamp,
          association_fee: listing.AssociationFee,
          association_fee_frequency: listing.AssociationFeeFrequency,
          tax_annual_amount: listing.TaxAnnualAmount,
          tax_year: listing.TaxYear,
          cooling: listing.Cooling,
          heating: listing.Heating,
          interior_features: listing.InteriorFeatures,
          exterior_features: listing.ExteriorFeatures,
          community_features: listing.CommunityFeatures,
          appliances: listing.Appliances,
          view: listing.View,
          pool_yn: listing.PoolPrivateYN,
          waterfront_yn: listing.WaterfrontYN,
          subdivision_name: listing.SubdivisionName,
          neighborhood: listing.Neighborhood,
          virtual_tour_url: listing.VirtualTourURLUnbranded,
          video_url: listing.VideoURL,
          photos: listing.Media ? listing.Media.filter(m => m.MediaCategory === "Photo").map(m => ({
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
          console.error(`Error upserting listing ${listing.ListingKey}:`, upsertError);
          errors++;
        } else {
          // Check if it was created or updated
          const { data: existing } = await supabase
            .from("mls_listings")
            .select("created_at, updated_at")
            .eq("listing_key", listing.ListingKey)
            .single();

          if (existing && existing.created_at === existing.updated_at) {
            created++;
          } else {
            updated++;
          }
        }
      } catch (err) {
        console.error(`Error processing listing ${listing.ListingKey}:`, err);
        errors++;
      }
    }

    // Update sync log
    if (syncLogId) {
      await supabase
        .from("mls_sync_logs")
        .update({
          status: errors > 0 ? "completed_with_errors" : "completed",
          listings_fetched: listings.length,
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
        fetched: listings.length,
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
