import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://presaleproperties.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LoftyContact {
  id?: string;
  lead_id?: string;
  firstName?: string;
  lastName?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  source?: string;
  tags?: string[];
  notes?: string;
  created_at?: string;
  createdAt?: string;
  last_activity?: string;
  lastActivity?: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const loftyApiKey = Deno.env.get("LOFTY_API_KEY");
    
    if (!loftyApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "LOFTY_API_KEY not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { searchQuery, email } = await req.json();
    console.log("Searching Lofty for:", { searchQuery, email });

    // Try different auth header formats and API versions
    const authHeadersToTry = [
      `token ${loftyApiKey}`,
      `Bearer ${loftyApiKey}`,
    ];
    
    const searchUrls = [
      "https://api.lofty.com/v1.0/leads",
      "https://api.lofty.com/v1/leads",
      "https://api.chime.me/v1.0/leads",
      "https://api.chime.me/v1/leads",
    ];

    let workingAuth = "";
    let baseUrl = "";
    let contacts: LoftyContact[] = [];

    // Find working auth by testing each combination
    for (const url of searchUrls) {
      for (const auth of authHeadersToTry) {
        try {
          console.log(`Trying ${url} with auth: ${auth.substring(0, 10)}...`);
          
          // Build search params
          const searchParams = new URLSearchParams();
          if (email) {
            searchParams.append("email", email);
          } else if (searchQuery) {
            // Try searching by name - different APIs use different params
            searchParams.append("q", searchQuery);
            searchParams.append("search", searchQuery);
            searchParams.append("name", searchQuery);
          }
          searchParams.append("limit", "50");
          
          const searchUrl = `${url}?${searchParams.toString()}`;
          console.log("Search URL:", searchUrl);
          
          const response = await fetch(searchUrl, {
            method: "GET",
            headers: {
              "Accept": "application/json",
              "Authorization": auth,
            },
          });

          console.log(`Response status: ${response.status}`);
          
          if (response.ok) {
            workingAuth = auth;
            baseUrl = url;
            const data = await response.json();
            console.log("Lofty response:", JSON.stringify(data).substring(0, 500));
            
            // Handle different response formats
            if (Array.isArray(data)) {
              contacts = data;
            } else if (data.data && Array.isArray(data.data)) {
              contacts = data.data;
            } else if (data.leads && Array.isArray(data.leads)) {
              contacts = data.leads;
            } else if (data.contacts && Array.isArray(data.contacts)) {
              contacts = data.contacts;
            } else if (data.results && Array.isArray(data.results)) {
              contacts = data.results;
            }
            
            // If we got results, filter by search query if needed
            if (contacts.length > 0 && searchQuery && !email) {
              const query = searchQuery.toLowerCase();
              contacts = contacts.filter((c: LoftyContact) => {
                const firstName = (c.firstName || c.first_name || "").toLowerCase();
                const lastName = (c.lastName || c.last_name || "").toLowerCase();
                const fullName = `${firstName} ${lastName}`;
                const contactEmail = (c.email || "").toLowerCase();
                return fullName.includes(query) || 
                       firstName.includes(query) || 
                       lastName.includes(query) ||
                       contactEmail.includes(query);
              });
            }
            
            break;
          }
        } catch (error) {
          console.log(`Error with ${url}: ${error}`);
        }
      }
      if (workingAuth) break;
    }

    if (!workingAuth) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Could not connect to Lofty API. Please check your API key.",
          contacts: []
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize contact data
    const normalizedContacts = contacts.map((c: LoftyContact) => ({
      id: c.id || c.lead_id,
      first_name: c.firstName || c.first_name || "",
      last_name: c.lastName || c.last_name || "",
      email: c.email || "",
      phone: c.phone || "",
      source: c.source || "Lofty",
      tags: c.tags || [],
      notes: c.notes || "",
      created_at: c.created_at || c.createdAt || null,
      last_activity: c.last_activity || c.lastActivity || null,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        contacts: normalizedContacts,
        count: normalizedContacts.length,
        apiEndpoint: baseUrl,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error searching Lofty:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error), contacts: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
