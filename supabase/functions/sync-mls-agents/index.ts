import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DDFAgent {
  MemberKey?: string;
  MemberMlsId?: string;
  MemberFirstName?: string;
  MemberLastName?: string;
  MemberFullName?: string;
  MemberEmail?: string;
  MemberPreferredPhone?: string;
  MemberDirectPhone?: string;
  MemberOfficePhone?: string;
  OfficeName?: string;
  OfficeKey?: string;
}

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

    // Get unique agent and office keys from listings that don't have cached data
    const { data: missingAgents } = await supabase
      .from("mls_listings")
      .select("list_agent_key")
      .not("list_agent_key", "is", null)
      .limit(500);

    const { data: missingOffices } = await supabase
      .from("mls_listings")
      .select("list_office_key")
      .not("list_office_key", "is", null)
      .limit(500);

    // Get already cached keys
    const { data: cachedAgents } = await supabase
      .from("mls_agents")
      .select("agent_key");
    
    const { data: cachedOffices } = await supabase
      .from("mls_offices")
      .select("office_key");

    const cachedAgentKeys = new Set((cachedAgents || []).map(a => a.agent_key));
    const cachedOfficeKeys = new Set((cachedOffices || []).map(o => o.office_key));

    // Filter to only uncached keys - limit to 25 per call to avoid timeout
    const agentKeysToFetch = [...new Set(
      (missingAgents || [])
        .map(l => l.list_agent_key)
        .filter(k => k && !cachedAgentKeys.has(k))
    )].slice(0, 25);

    const officeKeysToFetch = [...new Set(
      (missingOffices || [])
        .map(l => l.list_office_key)
        .filter(k => k && !cachedOfficeKeys.has(k))
    )].slice(0, 25);

    console.log(`Fetching ${agentKeysToFetch.length} agents, ${officeKeysToFetch.length} offices`);

    if (agentKeysToFetch.length === 0 && officeKeysToFetch.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "All agents and offices already cached", agentsFetched: 0, officesFetched: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = await getAccessToken(DDF_USERNAME, DDF_PASSWORD);

    let agentsFetched = 0;
    let officesFetched = 0;

    // Fetch agents one at a time (DDF API has node count limits)
    if (agentKeysToFetch.length > 0) {
      for (const agentKey of agentKeysToFetch) {
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
              const { error } = await supabase
                .from("mls_agents")
                .upsert({
                  agent_key: agent.MemberKey!,
                  agent_mls_id: agent.MemberMlsId,
                  full_name: agent.MemberFullName || 
                    (agent.MemberFirstName && agent.MemberLastName 
                      ? `${agent.MemberFirstName} ${agent.MemberLastName}`
                      : agent.MemberFirstName || agent.MemberLastName),
                  first_name: agent.MemberFirstName,
                  last_name: agent.MemberLastName,
                  email: agent.MemberEmail,
                  phone: agent.MemberDirectPhone || agent.MemberPreferredPhone || agent.MemberOfficePhone,
                  office_key: agent.OfficeKey,
                }, { onConflict: "agent_key" });

              if (!error) {
                agentsFetched++;
              }
            }
          } else {
            const errText = await response.text();
            console.error(`Agent API error for ${agentKey}:`, response.status, errText.substring(0, 200));
          }

          // Small delay to avoid rate limiting
          if (agentsFetched % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        } catch (err) {
          console.error(`Error fetching agent ${agentKey}:`, err);
        }
      }
    }

    // Fetch offices one at a time
    if (officeKeysToFetch.length > 0) {
      for (const officeKey of officeKeysToFetch) {
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

              if (!error) {
                officesFetched++;
              }
            }
          } else {
            const errText = await response.text();
            console.error(`Office API error for ${officeKey}:`, response.status, errText.substring(0, 200));
          }

          if (officesFetched % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        } catch (err) {
          console.error(`Error fetching office ${officeKey}:`, err);
        }
      }
    }

    // Update mls_listings with agent/office names from cache
    const { error: updateError } = await supabase.rpc("update_listing_agent_names");
    
    if (updateError) {
      console.log("Note: update_listing_agent_names function may not exist yet");
    }

    console.log(`Synced ${agentsFetched} agents, ${officesFetched} offices`);

    return new Response(
      JSON.stringify({
        success: true,
        agentsFetched,
        officesFetched,
        remainingAgents: agentKeysToFetch.length - agentsFetched,
        remainingOffices: officeKeysToFetch.length - officesFetched,
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
