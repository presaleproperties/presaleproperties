import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// DDF API response structure
interface DDFProperty {
  ListingKey?: string;
  ListingId?: string;
  ListPrice?: number;
  StandardStatus?: string;
  PropertyType?: string;
  PropertySubType?: string;
  CommonInterest?: string;
  StructureType?: string[];
  City?: string;
  StateOrProvince?: string;
  PostalCode?: string;
  UnparsedAddress?: string;
  StreetNumber?: string;
  StreetName?: string;
  StreetSuffix?: string;
  UnitNumber?: string;
  BedroomsTotal?: number;
  BathroomsTotalInteger?: number;
  BathroomsFull?: number;
  BathroomsHalf?: number;
  LivingArea?: number;
  LivingAreaUnits?: string;
  YearBuilt?: number;
  Latitude?: number;
  Longitude?: number;
  PublicRemarks?: string;
  ListAgentKey?: string;
  ListAgentMlsId?: string;
  ListAgentFullName?: string;
  ListAgentFirstName?: string;
  ListAgentLastName?: string;
  ListAgentEmail?: string;
  ListAgentDirectPhone?: string;
  ListAgentPreferredPhone?: string;
  ListOfficeName?: string;
  ListOfficeKey?: string;
  ListOfficeMlsId?: string;
  ListOfficePhone?: string;
  OriginalEntryTimestamp?: string;
  ModificationTimestamp?: string;
  PhotosCount?: number;
  Subdivision?: string;
  DaysOnMarket?: number;
  OriginalListPrice?: number;
  AssociationFee?: number;
  AssociationFeeFrequency?: string;
  TaxAnnualAmount?: number;
  TaxYear?: number;
  GarageSpaces?: number;
  ParkingTotal?: number;
  Stories?: number;
  VirtualTourURLUnbranded?: string;
  View?: string[];
  Heating?: string[];
  Cooling?: string[];
  InteriorFeatures?: string[];
  ExteriorFeatures?: string[];
  CommunityFeatures?: string[];
  Appliances?: string[];
  PoolYN?: boolean;
  WaterfrontYN?: boolean;
  Media?: Array<{
    MediaURL: string;
    MediaCategory?: string;
    Order?: number;
  }>;
  // Open House fields
  OpenHouse?: Array<{
    OpenHouseDate?: string;
    OpenHouseStartTime?: string;
    OpenHouseEndTime?: string;
    OpenHouseRemarks?: string;
  }>;
}

// Known Metro Vancouver neighborhoods by city for better matching
const CITY_NEIGHBORHOODS: Record<string, string[]> = {
  "Vancouver": ["Downtown", "Yaletown", "Gastown", "Coal Harbour", "West End", "Kitsilano", "Point Grey", "Kerrisdale", "Dunbar", "Southlands", "Marpole", "South Cambie", "Oakridge", "Shaughnessy", "Arbutus Ridge", "Riley Park", "Mount Pleasant", "Fairview", "Cambie", "Strathcona", "Grandview-Woodland", "Hastings-Sunrise", "Renfrew-Collingwood", "Killarney", "Victoria-Fraserview", "Sunset", "Kensington-Cedar Cottage"],
  "Burnaby": ["Metrotown", "Brentwood", "Highgate", "Edmonds", "Deer Lake", "Capitol Hill", "Sperling-Duthie", "Willingdon Heights", "Burnaby Heights", "Hastings", "Parkcrest", "Buckingham Heights", "Burnaby Mountain", "Forest Hills", "Lochdale", "Cascade-Schou", "Big Bend", "Cariboo"],
  "Surrey": ["Whalley", "Guildford", "Fleetwood", "Newton", "Cloverdale", "South Surrey", "White Rock", "Panorama Ridge", "Sullivan Heights", "Bear Creek", "King George Corridor", "Sunnyside Park", "East Newton", "West Newton", "Fraser Heights", "Port Kells", "Bridgeview", "City Centre"],
  "Richmond": ["Steveston", "Hamilton", "Seafair", "Broadmoor", "Thompson", "Terra Nova", "West Cambie", "Bridgeport", "City Centre", "East Richmond", "Gilmore", "Blundell", "Garden City", "McNair", "Brighouse"],
  "Coquitlam": ["Maillardville", "Austin Heights", "Burquitlam", "Westwood Plateau", "Burke Mountain", "Como Lake", "Cariboo", "Lincoln Park", "Scott Creek", "Canyon Springs", "Eagle Ridge", "Harbour Place", "Ranch Park", "River Springs"],
  "Langley": ["Willowbrook", "Walnut Grove", "Murrayville", "Brookswood", "Fernridge", "Aldergrove", "Fort Langley", "Langley City", "Langley Meadows", "Willoughby Heights", "Williams", "Yorkson Creek", "Milner"],
  "New Westminster": ["Downtown", "Uptown", "Sapperton", "Queensborough", "West End", "Queen's Park", "Glenbrooke North", "Connaught Heights", "Brow of the Hill", "Victory Heights", "Fraserview"],
  "North Vancouver": ["Lower Lonsdale", "Central Lonsdale", "Upper Lonsdale", "Lynn Valley", "Deep Cove", "Edgemont", "Capilano", "Pemberton Heights", "Norgate", "Blueridge", "Seymour Heights", "Dollarton", "Queensbury"],
  "Port Coquitlam": ["Downtown", "Citadel Heights", "Oxford Heights", "Mary Hill", "Shaughnessy", "Birchland", "Dominion Triangle", "Lincoln Park"],
  "Port Moody": ["Moody Centre", "Glenayre", "Harbour Chines", "Heritage Woods", "Pleasantside", "College Park", "Ioco", "Klahanie", "Suter Brook"],
  "Abbotsford": ["Clearbrook", "Downtown", "Sumas Mountain", "Mill Lake", "Matsqui", "McCallum", "Townline", "Auguston", "West Abbotsford", "Bradner"],
  "Delta": ["Ladner", "Tsawwassen", "North Delta", "Sunbury", "Annieville", "Sunshine Hills", "Kennedy", "Scott Point", "English Bluff"],
  "Maple Ridge": ["Downtown", "Albion", "Cottonwood", "Hammond", "Silver Valley", "Webster's Corners", "Whonnock", "Thornhill", "Haney"],
  "Chilliwack": ["Downtown", "Sardis", "Vedder", "Greendale", "Promontory", "Rosedale", "Yarrow", "Chilliwack Proper", "Fairfield Island"],
  "White Rock": ["East Beach", "West Beach", "Town Centre", "Hillside", "Hospital Area", "Kent Street"],
};

// Extract neighborhood from address or subdivision name
function extractNeighborhood(property: DDFProperty): string | null {
  // First check if Subdivision is provided
  if (property.Subdivision && property.Subdivision.trim()) {
    return property.Subdivision.trim();
  }
  
  const city = property.City || "";
  const cityNeighborhoods = CITY_NEIGHBORHOODS[city];
  
  if (cityNeighborhoods) {
    // Check street name for neighborhood patterns
    const streetName = property.StreetName?.toLowerCase() || "";
    const unparsedAddress = property.UnparsedAddress?.toLowerCase() || "";
    const combinedText = `${streetName} ${unparsedAddress}`;
    
    for (const neighborhood of cityNeighborhoods) {
      if (combinedText.includes(neighborhood.toLowerCase())) {
        return neighborhood;
      }
    }
    
    // Postal code based neighborhood inference for some cities
    const postalCode = property.PostalCode?.toUpperCase() || "";
    
    // Vancouver postal code mappings (simplified)
    if (city === "Vancouver") {
      if (postalCode.startsWith("V6B") || postalCode.startsWith("V6C") || postalCode.startsWith("V6E")) return "Downtown";
      if (postalCode.startsWith("V6Z")) return "Yaletown";
      if (postalCode.startsWith("V6G")) return "West End";
      if (postalCode.startsWith("V5Y") || postalCode.startsWith("V5Z")) return "Mount Pleasant";
      if (postalCode.startsWith("V6K")) return "Kitsilano";
      if (postalCode.startsWith("V6R") || postalCode.startsWith("V6S")) return "Kerrisdale";
      if (postalCode.startsWith("V6T")) return "Point Grey";
    }
    
    if (city === "Burnaby") {
      if (postalCode.startsWith("V5H") || postalCode.startsWith("V5E")) return "Metrotown";
      if (postalCode.startsWith("V5C")) return "Brentwood";
      if (postalCode.startsWith("V3N")) return "Edmonds";
    }
    
    if (city === "Richmond") {
      if (postalCode.startsWith("V6X") || postalCode.startsWith("V6Y")) return "City Centre";
      if (postalCode.startsWith("V7E")) return "Steveston";
    }
    
    if (city === "Surrey") {
      if (postalCode.startsWith("V3T") || postalCode.startsWith("V3R")) return "City Centre";
      if (postalCode.startsWith("V3S")) return "South Surrey";
      if (postalCode.startsWith("V3W")) return "Guildford";
    }
  }
  
  return null;
}

// Infer property type from available data since PropertySubType is unreliable
function inferPropertyType(property: DDFProperty): string {
  const hasUnitNumber = property.UnitNumber && property.UnitNumber.trim() !== '';
  const livingArea = property.LivingArea || 0;
  const associationFee = property.AssociationFee || 0;
  const stories = property.Stories || 0;
  const structureType = property.StructureType || [];
  
  // Check structure type array for hints
  const structureTypeStr = structureType.join(' ').toLowerCase();
  if (structureTypeStr.includes('apartment') || structureTypeStr.includes('condo')) {
    return 'Apartment/Condo';
  }
  if (structureTypeStr.includes('townhouse') || structureTypeStr.includes('row')) {
    return 'Townhouse';
  }
  if (structureTypeStr.includes('duplex')) {
    return 'Duplex';
  }
  
  // Condo indicators: has unit number, smaller size, higher strata fee, often in high-rise
  if (hasUnitNumber && livingArea < 2000 && associationFee > 200) {
    return 'Apartment/Condo';
  }
  
  // Townhouse indicators: has strata fee, medium size, typically 2-3 stories
  if (associationFee > 100 && livingArea >= 1000 && livingArea < 2800) {
    // If unit number looks like a townhouse (e.g., "1", "2", "A", "B" or "SL1")
    if (hasUnitNumber) {
      const unitNum = property.UnitNumber!.toUpperCase();
      // High unit numbers (like 2808) are condos, low numbers are townhomes
      const numericUnit = parseInt(unitNum.replace(/[^0-9]/g, ''));
      if (!isNaN(numericUnit) && numericUnit > 100) {
        return 'Apartment/Condo';
      }
      return 'Townhouse';
    }
    // Row townhomes without unit numbers but with strata fees
    if (stories >= 2 && stories <= 3) {
      return 'Townhouse';
    }
  }
  
  // No strata fee and no unit number = likely single family
  if (!hasUnitNumber && associationFee === 0) {
    return 'Single Family';
  }
  
  // Duplex: 2 units, moderate size
  if (structureTypeStr.includes('duplex') || (hasUnitNumber && livingArea > 1500 && livingArea < 2500 && associationFee < 150)) {
    return 'Duplex';
  }
  
  // Default fallback based on size
  if (livingArea >= 2500) {
    return 'Single Family';
  }
  
  // If has strata fee, likely condo/townhouse
  if (associationFee > 0) {
    return livingArea < 1500 ? 'Apartment/Condo' : 'Townhouse';
  }
  
  return property.PropertySubType || 'Residential';
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
    let offset = 0;
    let maxBatches = 50; // Process max 50 batches (5000 listings) per call
    let metroVancouverResidential = false; // New filter: condos, townhomes, single family in Metro Van only
    
    try {
      const body = await req.json();
      if (body?.city) filterCity = body.city;
      if (body?.offset !== undefined) offset = parseInt(body.offset) || 0;
      if (body?.maxBatches) maxBatches = Math.min(parseInt(body.maxBatches) || 30, 50);
      if (body?.metroVancouverResidential) metroVancouverResidential = true;
    } catch {
      // No body or invalid JSON
    }
    
    console.log(`Sync starting with offset=${offset}, maxBatches=${maxBatches}`);

    // Log sync start (only if starting fresh)
    let syncLogId: string | undefined;
    
    if (offset === 0) {
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
      syncLogId = syncLog?.id;
    } else {
      // Get the latest running sync log
      const { data: existingLog } = await supabase
        .from("mls_sync_logs")
        .select("id")
        .eq("status", "running")
        .order("started_at", { ascending: false })
        .limit(1)
        .single();
      
      syncLogId = existingLog?.id;
    }

    // Step 1: Get access token
    const accessToken = await getAccessToken(DDF_USERNAME, DDF_PASSWORD);

    // Step 2: Fetch properties from DDF API with pagination
    const apiBaseUrl = "https://ddfapi.realtor.ca/odata/v1/Property";
    const BATCH_SIZE = 100; // DDF API max is 100 records per request
    
    // Build filter for BC - all active listings
    const filters: string[] = [];
    filters.push("StateOrProvince eq 'British Columbia'");
    filters.push("StandardStatus eq 'Active'");
    
    // Only add city filter if explicitly specified
    if (filterCity) {
      filters.push(`City eq '${filterCity}'`);
    }
    
    // Metro Vancouver Residential: Use CommonInterest for condos/strata properties
    // This is the only reliable filter that works with DDF API
    if (metroVancouverResidential) {
      // CommonInterest eq 'Condo/Strata' captures condos AND townhomes (strata titled)
      // We'll sync all and filter locally for display
      filters.push("CommonInterest eq 'Condo/Strata'");
      console.log("Filtering for: Strata properties (Condos + Strata Townhomes) via CommonInterest eq 'Condo/Strata'");
    }

    let allProperties: DDFProperty[] = [];
    let skip = offset;
    let batchCount = 0;
    let hasMore = true;
    let totalFetched = offset;
    let totalCount = 0;

    console.log(`Starting paginated fetch from offset ${offset}...`);

    // Paginate through results (limited batches per call)
    while (hasMore && batchCount < maxBatches) {
      const queryParams = [
        `$top=${BATCH_SIZE}`,
        `$skip=${skip}`,
        `$filter=${filters.join(' and ')}`,
        "$orderby=ModificationTimestamp desc",
        "$count=true"
      ];

      const apiUrl = `${apiBaseUrl}?${queryParams.join("&")}`;
      
      console.log(`Fetching batch ${batchCount + 1}: skip=${skip}`);

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
      totalCount = data["@odata.count"] || 0;

      console.log(`Batch ${batchCount + 1}: ${properties.length} properties (total available: ${totalCount})`);

      if (properties.length === 0) {
        hasMore = false;
      } else {
        allProperties = allProperties.concat(properties);
        totalFetched += properties.length;
        skip += BATCH_SIZE;
        batchCount++;

        // Update sync log with progress
        if (syncLogId) {
          await supabase
            .from("mls_sync_logs")
            .update({
              listings_fetched: totalFetched,
              error_message: `Fetching... ${totalFetched} of ${totalCount}`,
            })
            .eq("id", syncLogId);
        }

        // Check if we've fetched all
        if (properties.length < BATCH_SIZE || totalFetched >= totalCount) {
          hasMore = false;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    console.log(`Fetched ${allProperties.length} properties in this batch`);

    let created = 0;
    let updated = 0;
    let errors = 0;

    // Process in batches for upsert
    const UPSERT_BATCH_SIZE = 50;
    
    for (let i = 0; i < allProperties.length; i += UPSERT_BATCH_SIZE) {
      const batch = allProperties.slice(i, i + UPSERT_BATCH_SIZE);
      
      const mlsListings = batch.map(property => {
        const listingKey = property.ListingKey || property.ListingId || `ddf-${Date.now()}-${Math.random()}`;
        
        // Helper to safely convert to integer
        const toInt = (val: number | undefined | null): number | null => 
          val !== undefined && val !== null ? Math.floor(val) : null;
        
        // Use inferred property type for more accurate categorization
        const inferredType = inferPropertyType(property);
        
        return {
          listing_key: listingKey,
          listing_id: property.ListingId || listingKey,
          listing_price: toInt(property.ListPrice) || 0,
          mls_status: property.StandardStatus || "Active",
          standard_status: property.StandardStatus || "Active",
          property_type: property.PropertyType || "Residential",
          property_sub_type: inferredType, // Use inferred type instead of raw API value
          city: property.City || "Unknown",
          state_or_province: property.StateOrProvince || "British Columbia",
          postal_code: property.PostalCode,
          unparsed_address: property.UnparsedAddress,
          street_number: property.StreetNumber,
          street_name: property.StreetName,
          street_suffix: property.StreetSuffix,
          unit_number: property.UnitNumber,
          neighborhood: extractNeighborhood(property),
          subdivision_name: property.Subdivision,
          bedrooms_total: toInt(property.BedroomsTotal),
          bathrooms_total: toInt(property.BathroomsTotalInteger),
          bathrooms_full: toInt(property.BathroomsFull),
          bathrooms_half: toInt(property.BathroomsHalf),
          living_area: toInt(property.LivingArea),
          living_area_units: property.LivingAreaUnits || "sqft",
          year_built: toInt(property.YearBuilt),
          latitude: property.Latitude,
          longitude: property.Longitude,
          public_remarks: property.PublicRemarks,
          list_agent_key: property.ListAgentKey,
          list_agent_mls_id: property.ListAgentMlsId,
          list_agent_name: property.ListAgentFullName || 
            (property.ListAgentFirstName && property.ListAgentLastName 
              ? `${property.ListAgentFirstName} ${property.ListAgentLastName}` 
              : property.ListAgentFirstName || property.ListAgentLastName || null),
          list_agent_email: property.ListAgentEmail,
          list_agent_phone: property.ListAgentDirectPhone || property.ListAgentPreferredPhone,
          list_office_key: property.ListOfficeKey,
          list_office_mls_id: property.ListOfficeMlsId,
          list_office_name: property.ListOfficeName,
          list_office_phone: property.ListOfficePhone,
          original_list_price: toInt(property.OriginalListPrice),
          days_on_market: toInt(property.DaysOnMarket),
          association_fee: property.AssociationFee,
          association_fee_frequency: property.AssociationFeeFrequency,
          tax_annual_amount: property.TaxAnnualAmount,
          tax_year: toInt(property.TaxYear),
          garage_spaces: toInt(property.GarageSpaces),
          parking_total: toInt(property.ParkingTotal),
          stories: toInt(property.Stories),
          virtual_tour_url: property.VirtualTourURLUnbranded,
          view: property.View,
          heating: property.Heating,
          cooling: property.Cooling,
          interior_features: property.InteriorFeatures,
          exterior_features: property.ExteriorFeatures,
          community_features: property.CommunityFeatures,
          appliances: property.Appliances,
          pool_yn: property.PoolYN,
          waterfront_yn: property.WaterfrontYN,
          photos: property.Media ? property.Media.map(m => ({
            MediaURL: m.MediaURL,
            order: m.Order || 0,
          })) : null,
          list_date: property.OriginalEntryTimestamp ? new Date(property.OriginalEntryTimestamp).toISOString() : new Date().toISOString(),
          modification_timestamp: property.ModificationTimestamp,
          last_synced_at: new Date().toISOString(),
          // Open House data - get the next upcoming open house
          open_house_date: property.OpenHouse && property.OpenHouse.length > 0 
            ? (() => {
                const today = new Date().toISOString().split('T')[0];
                const upcoming = property.OpenHouse
                  .filter(oh => oh.OpenHouseDate && oh.OpenHouseDate >= today)
                  .sort((a, b) => (a.OpenHouseDate || '').localeCompare(b.OpenHouseDate || ''))[0];
                return upcoming?.OpenHouseDate || null;
              })()
            : null,
          open_house_start_time: property.OpenHouse && property.OpenHouse.length > 0
            ? (() => {
                const today = new Date().toISOString().split('T')[0];
                const upcoming = property.OpenHouse
                  .filter(oh => oh.OpenHouseDate && oh.OpenHouseDate >= today)
                  .sort((a, b) => (a.OpenHouseDate || '').localeCompare(b.OpenHouseDate || ''))[0];
                return upcoming?.OpenHouseStartTime || null;
              })()
            : null,
          open_house_end_time: property.OpenHouse && property.OpenHouse.length > 0
            ? (() => {
                const today = new Date().toISOString().split('T')[0];
                const upcoming = property.OpenHouse
                  .filter(oh => oh.OpenHouseDate && oh.OpenHouseDate >= today)
                  .sort((a, b) => (a.OpenHouseDate || '').localeCompare(b.OpenHouseDate || ''))[0];
                return upcoming?.OpenHouseEndTime || null;
              })()
            : null,
          open_house_remarks: property.OpenHouse && property.OpenHouse.length > 0
            ? (() => {
                const today = new Date().toISOString().split('T')[0];
                const upcoming = property.OpenHouse
                  .filter(oh => oh.OpenHouseDate && oh.OpenHouseDate >= today)
                  .sort((a, b) => (a.OpenHouseDate || '').localeCompare(b.OpenHouseDate || ''))[0];
                return upcoming?.OpenHouseRemarks || null;
              })()
            : null,
        };
      });

      // Upsert batch
      const { error: upsertError } = await supabase
        .from("mls_listings")
        .upsert(mlsListings, { onConflict: "listing_key" });

      if (upsertError) {
        console.error(`Error upserting batch at ${i}:`, upsertError);
        errors += batch.length;
      } else {
        created += batch.length;
      }
    }

    // Determine if sync is complete or needs to continue
    const isComplete = !hasMore || totalFetched >= totalCount;
    const nextResumeFrom = hasMore ? skip : null;

    // Update sync log
    if (syncLogId) {
      await supabase
        .from("mls_sync_logs")
        .update({
          status: isComplete ? (errors > 0 ? "completed_with_errors" : "completed") : "running",
          listings_fetched: totalFetched,
          listings_created: created,
          listings_updated: updated,
          completed_at: isComplete ? new Date().toISOString() : null,
          error_message: isComplete 
            ? (errors > 0 ? `${errors} listings failed to process` : null)
            : `Processed ${totalFetched} of ${totalCount}. Resume from ${skip}.`,
        })
        .eq("id", syncLogId);
    }

    console.log(`Batch completed: ${created} processed, ${errors} errors. Complete: ${isComplete}`);

    return new Response(
      JSON.stringify({
        success: true,
        fetched: allProperties.length,
        totalFetched,
        totalCount,
        created,
        updated,
        errors,
        isComplete,
        nextResumeFrom,
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