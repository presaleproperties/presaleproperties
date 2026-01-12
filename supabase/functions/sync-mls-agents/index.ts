import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DDFOffice {
  OfficeKey?: string;
  OfficeMlsId?: string;
  OfficeName?: string;
  OfficePhone?: string;
  OfficeAddress1?: string;
  OfficeCity?: string;
}

async function getAccessToken(clientId: string, clientSecret: string): Promise<string> {
  const tokenUrl = "https://identity.crea.ca/connect/token";
  
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope: "DDFApi_Read",
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${response.status}`);
  }

  const data = await response.json();
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

    // Step 1: Get ALL unique office keys from active listings
    const { data: allOfficeKeys, error: officeKeysError } = await supabase
      .from("mls_listings")
      .select("list_office_key")
      .eq("mls_status", "Active")
      .not("list_office_key", "is", null);

    if (officeKeysError) {
      throw new Error(`Failed to fetch office keys: ${officeKeysError.message}`);
    }

    // Get unique office keys
    const uniqueOfficeKeys = [...new Set(
      (allOfficeKeys || []).map(l => l.list_office_key).filter(Boolean)
    )];

    console.log(`Found ${uniqueOfficeKeys.length} unique office keys in listings`);

    // Get already cached offices
    const { data: cachedOffices } = await supabase
      .from("mls_offices")
      .select("office_key, office_name");
    
    const cachedOfficeMap = new Map(
      (cachedOffices || []).map(o => [o.office_key, o.office_name])
    );

    console.log(`Already cached: ${cachedOfficeMap.size} offices`);

    // Filter to only uncached keys
    const officeKeysToFetch = uniqueOfficeKeys.filter(k => !cachedOfficeMap.has(k));

    console.log(`Need to fetch: ${officeKeysToFetch.length} offices from DDF API`);

    let officesFetched = 0;
    let fetchErrors = 0;

    // Only fetch from API if there are uncached offices
    if (officeKeysToFetch.length > 0) {
      const accessToken = await getAccessToken(DDF_USERNAME, DDF_PASSWORD);

      // Process in batches of 50 to avoid timeout
      const batchSize = 50;
      const maxBatches = 20; // Max 1000 offices per call
      const keysToProcess = officeKeysToFetch.slice(0, batchSize * maxBatches);

      for (let i = 0; i < keysToProcess.length; i++) {
        const officeKey = keysToProcess[i];
        try {
          const apiUrl = `https://ddfapi.realtor.ca/odata/v1/Office?$filter=OfficeKey eq '${officeKey}'&$top=1`;
          
          const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Accept": "application/json",
            },
          });

          if (response.ok) {
            const data = await response.json();
            const offices: DDFOffice[] = data.value || [];
            
            if (offices.length > 0) {
              const office = offices[0];
              const { error } = await supabase
                .from("mls_offices")
                .upsert({
                  office_key: office.OfficeKey!,
                  office_mls_id: office.OfficeMlsId,
                  office_name: office.OfficeName,
                  phone: office.OfficePhone,
                  address: office.OfficeAddress1,
                  city: office.OfficeCity,
                }, { onConflict: "office_key" });

              if (!error && office.OfficeName) {
                cachedOfficeMap.set(office.OfficeKey!, office.OfficeName);
                officesFetched++;
              }
            }
          } else {
            fetchErrors++;
            if (fetchErrors <= 5) {
              console.error(`Office API error for ${officeKey}:`, response.status);
            }
          }

          // Small delay every 10 requests to avoid rate limiting
          if (i > 0 && i % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (err) {
          fetchErrors++;
          if (fetchErrors <= 5) {
            console.error(`Error fetching office ${officeKey}:`, err);
          }
        }
      }
    }

    console.log(`Fetched ${officesFetched} new offices, ${fetchErrors} errors`);

    // Step 2: Backfill list_office_name on listings from cache
    // Find listings that have office_key but no office_name
    const { data: listingsToUpdate } = await supabase
      .from("mls_listings")
      .select("id, list_office_key")
      .eq("mls_status", "Active")
      .not("list_office_key", "is", null)
      .is("list_office_name", null)
      .limit(2000);

    let listingsUpdated = 0;

    if (listingsToUpdate && listingsToUpdate.length > 0) {
      // Build updates from cache
      const updates = listingsToUpdate
        .filter(l => cachedOfficeMap.has(l.list_office_key))
        .map(l => ({
          id: l.id,
          list_office_name: cachedOfficeMap.get(l.list_office_key),
        }));

      if (updates.length > 0) {
        // Update in batches of 100
        for (let i = 0; i < updates.length; i += 100) {
          const batch = updates.slice(i, i + 100);
          for (const update of batch) {
            const { error } = await supabase
              .from("mls_listings")
              .update({ list_office_name: update.list_office_name })
              .eq("id", update.id);
            
            if (!error) listingsUpdated++;
          }
        }
      }

      console.log(`Updated ${listingsUpdated} listings with office names`);
    }

    // Count remaining uncached
    const remainingUncached = officeKeysToFetch.length - officesFetched;

    return new Response(
      JSON.stringify({
        success: true,
        totalUniqueOffices: uniqueOfficeKeys.length,
        alreadyCached: cachedOfficeMap.size - officesFetched,
        officesFetched,
        fetchErrors,
        listingsUpdated,
        remainingUncached: Math.max(0, remainingUncached),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Sync error:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
