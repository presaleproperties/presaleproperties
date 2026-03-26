import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://presaleproperties.com",
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

interface DDFAgent {
  MemberKey?: string;
  MemberMlsId?: string;
  MemberFullName?: string;
  MemberFirstName?: string;
  MemberLastName?: string;
  MemberEmail?: string;
  MemberDirectPhone?: string;
  MemberPreferredPhone?: string;
  MemberMobilePhone?: string;
  OfficeKey?: string;
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
    
    let agentsFetched = 0;
    let agentErrors = 0;
    let officesFetched = 0;
    let officeErrors = 0;
    let listingsUpdatedAgent = 0;
    let listingsUpdatedOffice = 0;

    // Get access token once for all API calls
    const accessToken = await getAccessToken(DDF_USERNAME, DDF_PASSWORD);
    console.log("Got DDF access token");

    // ========== AGENT SYNC ==========
    // Step 1: Get all unique agent keys from active listings
    const { data: allAgentKeys, error: agentKeysError } = await supabase
      .from("mls_listings")
      .select("list_agent_key")
      .eq("mls_status", "Active")
      .not("list_agent_key", "is", null);

    if (agentKeysError) {
      throw new Error(`Failed to fetch agent keys: ${agentKeysError.message}`);
    }

    const uniqueAgentKeys = [...new Set(
      (allAgentKeys || []).map(l => l.list_agent_key).filter(Boolean)
    )];

    console.log(`Found ${uniqueAgentKeys.length} unique agent keys in listings`);

    // Get already cached agents
    const { data: cachedAgents } = await supabase
      .from("mls_agents")
      .select("agent_key, full_name");
    
    const cachedAgentMap = new Map(
      (cachedAgents || []).map(a => [a.agent_key, a.full_name])
    );

    console.log(`Already cached: ${cachedAgentMap.size} agents`);

    // Filter to only uncached agent keys
    const agentKeysToFetch = uniqueAgentKeys.filter(k => !cachedAgentMap.has(k));

    console.log(`Need to fetch: ${agentKeysToFetch.length} agents from DDF API`);

    // Fetch agents from API (limit to 50 per run to avoid timeout)
    if (agentKeysToFetch.length > 0) {
      const batchSize = 50;
      const keysToProcess = agentKeysToFetch.slice(0, batchSize);

      for (let i = 0; i < keysToProcess.length; i++) {
        const agentKey = keysToProcess[i];
        try {
          const apiUrl = `https://ddfapi.realtor.ca/odata/v1/Member?$filter=MemberKey eq '${agentKey}'&$top=1`;
          
          const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Accept": "application/json",
            },
          });

          if (response.ok) {
            const data = await response.json();
            const agents: DDFAgent[] = data.value || [];
            
            if (agents.length > 0) {
              const agent = agents[0];
              const fullName = agent.MemberFullName || 
                [agent.MemberFirstName, agent.MemberLastName].filter(Boolean).join(" ") || 
                null;
              
              const phone = agent.MemberDirectPhone || 
                agent.MemberPreferredPhone || 
                agent.MemberMobilePhone || 
                null;

              const { error } = await supabase
                .from("mls_agents")
                .upsert({
                  agent_key: agent.MemberKey!,
                  agent_mls_id: agent.MemberMlsId,
                  full_name: fullName,
                  first_name: agent.MemberFirstName,
                  last_name: agent.MemberLastName,
                  email: agent.MemberEmail,
                  phone: phone,
                  office_key: agent.OfficeKey,
                }, { onConflict: "agent_key" });

              if (!error && fullName) {
                cachedAgentMap.set(agent.MemberKey!, fullName);
                agentsFetched++;
              }
            }
          } else {
            agentErrors++;
            if (agentErrors <= 5) {
              console.error(`Agent API error for ${agentKey}:`, response.status);
            }
          }

          // Small delay every 10 requests to avoid rate limiting
          if (i > 0 && i % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (err) {
          agentErrors++;
          if (agentErrors <= 5) {
            console.error(`Error fetching agent ${agentKey}:`, err);
          }
        }
      }
    }

    console.log(`Fetched ${agentsFetched} new agents, ${agentErrors} errors`);

    // ========== OFFICE SYNC ==========
    // Step 2: Get all unique office keys from active listings
    const { data: allOfficeKeys, error: officeKeysError } = await supabase
      .from("mls_listings")
      .select("list_office_key")
      .eq("mls_status", "Active")
      .not("list_office_key", "is", null);

    if (officeKeysError) {
      throw new Error(`Failed to fetch office keys: ${officeKeysError.message}`);
    }

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

    // Filter to only uncached office keys
    const officeKeysToFetch = uniqueOfficeKeys.filter(k => !cachedOfficeMap.has(k));

    console.log(`Need to fetch: ${officeKeysToFetch.length} offices from DDF API`);

    // Fetch offices from API (limit to 50 per run)
    if (officeKeysToFetch.length > 0) {
      const batchSize = 50;
      const keysToProcess = officeKeysToFetch.slice(0, batchSize);

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
            officeErrors++;
            if (officeErrors <= 5) {
              console.error(`Office API error for ${officeKey}:`, response.status);
            }
          }

          // Small delay every 10 requests to avoid rate limiting
          if (i > 0 && i % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (err) {
          officeErrors++;
          if (officeErrors <= 5) {
            console.error(`Error fetching office ${officeKey}:`, err);
          }
        }
      }
    }

    console.log(`Fetched ${officesFetched} new offices, ${officeErrors} errors`);

    // ========== BACKFILL LISTINGS ==========
    // Step 3: Backfill list_agent_name on listings from cache
    const { data: listingsNeedingAgent } = await supabase
      .from("mls_listings")
      .select("id, list_agent_key")
      .eq("mls_status", "Active")
      .not("list_agent_key", "is", null)
      .is("list_agent_name", null)
      .limit(500);

    if (listingsNeedingAgent && listingsNeedingAgent.length > 0) {
      for (const listing of listingsNeedingAgent) {
        const agentName = cachedAgentMap.get(listing.list_agent_key);
        if (agentName) {
          const { error } = await supabase
            .from("mls_listings")
            .update({ list_agent_name: agentName })
            .eq("id", listing.id);
          
          if (!error) listingsUpdatedAgent++;
        }
      }
      console.log(`Updated ${listingsUpdatedAgent} listings with agent names`);
    }

    // Step 4: Backfill list_office_name on listings from cache
    const { data: listingsNeedingOffice } = await supabase
      .from("mls_listings")
      .select("id, list_office_key")
      .eq("mls_status", "Active")
      .not("list_office_key", "is", null)
      .is("list_office_name", null)
      .limit(500);

    if (listingsNeedingOffice && listingsNeedingOffice.length > 0) {
      for (const listing of listingsNeedingOffice) {
        const officeName = cachedOfficeMap.get(listing.list_office_key);
        if (officeName) {
          const { error } = await supabase
            .from("mls_listings")
            .update({ list_office_name: officeName })
            .eq("id", listing.id);
          
          if (!error) listingsUpdatedOffice++;
        }
      }
      console.log(`Updated ${listingsUpdatedOffice} listings with office names`);
    }

    // Calculate remaining uncached
    const remainingAgents = agentKeysToFetch.length - agentsFetched;
    const remainingOffices = officeKeysToFetch.length - officesFetched;

    return new Response(
      JSON.stringify({
        success: true,
        agents: {
          totalUnique: uniqueAgentKeys.length,
          alreadyCached: cachedAgentMap.size - agentsFetched,
          fetched: agentsFetched,
          errors: agentErrors,
          remaining: Math.max(0, remainingAgents),
        },
        offices: {
          totalUnique: uniqueOfficeKeys.length,
          alreadyCached: cachedOfficeMap.size - officesFetched,
          fetched: officesFetched,
          errors: officeErrors,
          remaining: Math.max(0, remainingOffices),
        },
        listingsUpdated: listingsUpdatedAgent + listingsUpdatedOffice,
        listingsUpdatedAgent,
        listingsUpdatedOffice,
        // Legacy fields for backwards compatibility
        agentsSynced: agentsFetched,
        officesSynced: officesFetched,
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
