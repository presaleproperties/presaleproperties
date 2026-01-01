import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ParsedFilters {
  city?: string;
  neighborhood?: string;
  project_type?: "condo" | "townhouse";
  property_type?: "condo" | "townhouse" | "other";
  unit_type?: string;
  max_price?: number;
  min_price?: number;
  max_deposit_percent?: number;
  completion_year?: number;
  buyer_intent?: string;
  near_skytrain?: boolean;
  beds?: number;
  min_sqft?: number;
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  filters?: ParsedFilters;
}

interface SearchResult {
  projects?: any[];
  listings?: any[];
  explanation: string;
  filters_applied: ParsedFilters;
  clarification_needed?: string;
  conversation_context?: string;
  search_mode: "projects" | "assignments";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, conversation = [], searchMode = "projects" } = await req.json();
    
    if (!query || typeof query !== "string" || query.trim().length < 3) {
      return new Response(
        JSON.stringify({ error: "Please enter a search query (at least 3 characters)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build conversation context for the AI
    const conversationContext = conversation.map((msg: ConversationMessage) => ({
      role: msg.role,
      content: msg.role === "assistant" 
        ? `Previous search: ${msg.content}${msg.filters ? ` [Filters: ${JSON.stringify(msg.filters)}]` : ""}`
        : msg.content
    }));

    const isAssignments = searchMode === "assignments";
    
    // Comprehensive system prompts with fuzzy matching instructions
    const systemPrompt = isAssignments 
      ? `You are a real estate search assistant for BC presale assignment listings. Parse user queries into structured filters.

CITIES (handle common typos and variations):
- Vancouver (van, vancover, vancuver, vanc)
- Burnaby (burnby, burnabee, burnabay)
- Surrey (surrey, surry, sury, surey)
- South Surrey (south surrey, south surry, s surrey)
- Langley (langely, lanley, langly, langey)
- Coquitlam (coquitlam, coquitlem, coq, coqutilam)
- Richmond (richmond, richmod, richmnd)
- New Westminster (new west, newwest, new westminster, newwestminster)
- Port Moody (port moody, portmoody, port mooy)
- Delta (delta, deta)
- Abbotsford (abbotsford, abby, abottsford, abbostford)
- North Vancouver (north van, north vancouver, n vancouver)
- Whiterock (white rock, whiterock, white rok)

NEIGHBORHOODS (handle typos):
- Jericho (jeriko, jerico, jericho)
- Kitsilano (kits, kitsalano)
- Metrotown (metro town, metrotawn)
- Brentwood (brentwood, brentwod)
- Willoughby (willoughby, wiloughby, willowby)
- Clayton (clayton, clayon)
- Walnut Grove (walnut grove, walnutgrove)
- Yorkson (yorkson, yorckson)

SPELLING CORRECTION RULES:
1. ALWAYS try to match misspelled words to the closest city/neighborhood
2. Be lenient - "langely" → Langley, "jeriko" → Jericho (neighborhood)
3. If unsure, pick the most likely match rather than asking for clarification
4. Price shortcuts: "600k" = 600000, "1m" = 1000000, "1.5m" = 1500000

Property types: condo, townhouse, other
Unit types: studio, 1bed, 1bed_den, 2bed, 2bed_den, 3bed, penthouse

Extract filters from the user's query. Be generous in interpretation.
For prices: "under 600k" = max_price: 600000
For bedrooms: "2 bed" = beds: 2

IMPORTANT: Always try to understand user intent. If they mention a place name, try to match it even if misspelled.`
      : `You are a real estate search assistant for BC presale properties. Parse user queries into structured filters.

CITIES (handle common typos and variations):
- Vancouver (van, vancover, vancuver, vanc)
- Burnaby (burnby, burnabee, burnabay)
- Surrey (surrey, surry, sury, surey)
- South Surrey (south surrey, south surry, s surrey)
- Langley (langely, lanley, langly, langey)
- Coquitlam (coquitlam, coquitlem, coq, coqutilam)
- Richmond (richmond, richmod, richmnd)
- New Westminster (new west, newwest, new westminster, newwestminster)
- Port Moody (port moody, portmoody, port mooy)
- Delta (delta, deta)
- Abbotsford (abbotsford, abby, abottsford, abbostford)
- North Vancouver (north van, north vancouver, n vancouver)
- Whiterock (white rock, whiterock, white rok)

NEIGHBORHOODS (handle typos):
- Jericho (jeriko, jerico, jericho) - in Vancouver
- Kitsilano (kits, kitsalano) - in Vancouver
- Metrotown (metro town, metrotawn) - in Burnaby
- Brentwood (brentwood, brentwod) - in Burnaby
- Willoughby (willoughby, wiloughby, willowby) - in Langley
- Clayton (clayton, clayon) - in Surrey
- Walnut Grove (walnut grove, walnutgrove) - in Langley
- Yorkson (yorkson, yorckson) - in Langley
- Murrayville (murrayville, murayville) - in Langley

SPELLING CORRECTION RULES:
1. ALWAYS try to match misspelled words to the closest city/neighborhood
2. Be lenient - "langely" → Langley, "2 bed langly" → city: Langley + beds: 2
3. If unsure, pick the most likely match rather than asking for clarification
4. Price shortcuts: "600k" = 600000, "under 600k" = max_price: 600000, "1m" = 1000000

Project types: condo, townhouse
Unit types: studio, 1bed, 2bed, 3bed, 4bed+

EXTRACT THESE PATTERNS:
- "2 bed in Langley" → city: Langley, unit_type: 2bed
- "under 600k" → max_price: 600000
- "townhouse" → project_type: townhouse
- "near skytrain" → near_skytrain: true
- "10% deposit" → max_deposit_percent: 10

IMPORTANT: Always try to understand user intent. If they mention a place name, try to match it even if misspelled. Never ask for clarification if you can make a reasonable guess.`;

    // Different filter parameters for projects vs assignments
    const filterProperties = isAssignments
      ? {
          city: { type: "string", description: "City name - correct any spelling mistakes to closest match" },
          neighborhood: { type: "string", description: "Specific neighborhood - correct spelling mistakes" },
          property_type: { type: "string", enum: ["condo", "townhouse", "other"] },
          beds: { type: "number", description: "Number of bedrooms (0 for studio, 1, 2, 3, etc.)" },
          max_price: { type: "number", description: "Maximum assignment price in dollars" },
          min_price: { type: "number", description: "Minimum assignment price in dollars" },
          min_sqft: { type: "number", description: "Minimum interior square footage" },
          completion_year: { type: "number", description: "Expected completion year" },
          buyer_intent: { type: "string", description: "Buyer type: first-time, investor, family" }
        }
      : {
          city: { type: "string", description: "City name - correct any spelling mistakes to closest match" },
          neighborhood: { type: "string", description: "Specific neighborhood - correct spelling mistakes" },
          project_type: { type: "string", enum: ["condo", "townhouse"] },
          unit_type: { type: "string", enum: ["studio", "1bed", "2bed", "3bed", "4bed+"] },
          max_price: { type: "number", description: "Maximum price in dollars (e.g., 600000 for 600k)" },
          min_price: { type: "number", description: "Minimum price in dollars" },
          max_deposit_percent: { type: "number", description: "Maximum deposit percentage (e.g., 10 for 10%)" },
          completion_year: { type: "number", description: "Expected completion year" },
          near_skytrain: { type: "boolean", description: "Must be near SkyTrain" },
          buyer_intent: { type: "string", description: "Buyer type: first-time, investor, family" }
        };

    // Step 1: Use AI to parse the natural language query with conversation context
    const parseResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          ...conversationContext,
          {
            role: "user",
            content: query
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_search_filters",
              description: "Extract structured search filters from natural language query. Be lenient with spelling - always try to match to closest city/neighborhood.",
              parameters: {
                type: "object",
                properties: {
                  filters: {
                    type: "object",
                    properties: filterProperties,
                    additionalProperties: false
                  },
                  is_followup: {
                    type: "boolean",
                    description: "True if this query refines a previous search"
                  },
                  clarification_needed: { 
                    type: "string", 
                    description: "ONLY ask if query is completely unrelated to real estate. Try to interpret first." 
                  },
                  search_summary: {
                    type: "string",
                    description: "Brief summary of what the user is looking for"
                  }
                },
                required: ["filters", "search_summary"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_search_filters" } }
      }),
    });

    if (!parseResponse.ok) {
      const errorText = await parseResponse.text();
      console.error("AI parsing error:", parseResponse.status, errorText);
      
      if (parseResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Search is busy. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("Failed to parse search query");
    }

    const parseData = await parseResponse.json();
    const toolCall = parseData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      throw new Error("Failed to extract search filters");
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    const filters: ParsedFilters = parsed.filters || {};
    const clarificationNeeded = parsed.clarification_needed;
    const searchSummary = parsed.search_summary || "your search";
    const isFollowup = parsed.is_followup || false;

    console.log("Parsed filters:", filters);
    console.log("Is followup:", isFollowup);
    console.log("Clarification:", clarificationNeeded);

    // If clarification is needed and no concrete filters, return early
    if (clarificationNeeded && Object.keys(filters).length === 0) {
      return new Response(
        JSON.stringify({
          projects: [],
          listings: [],
          explanation: clarificationNeeded,
          filters_applied: filters,
          clarification_needed: clarificationNeeded,
          conversation_context: searchSummary,
          search_mode: searchMode
        } as SearchResult),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Query the database with extracted filters
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let explanation = "";
    let resultsWithReasons: any[] = [];

    if (isAssignments) {
      // Query listings table for assignments
      let dbQuery = supabase
        .from("listings")
        .select(`
          id, title, project_name, developer_name, city, neighborhood, 
          property_type, unit_type, beds, baths, interior_sqft, exterior_sqft,
          assignment_price, original_price, deposit_paid, 
          completion_year, completion_month, status,
          listing_photos (url, sort_order)
        `)
        .eq("status", "published")
        .order("created_at", { ascending: false });

      // Apply filters for assignments
      if (filters.city) {
        dbQuery = dbQuery.ilike("city", `%${filters.city}%`);
      }
      if (filters.neighborhood) {
        dbQuery = dbQuery.ilike("neighborhood", `%${filters.neighborhood}%`);
      }
      if (filters.property_type) {
        dbQuery = dbQuery.eq("property_type", filters.property_type);
      }
      if (filters.beds !== undefined) {
        dbQuery = dbQuery.eq("beds", filters.beds);
      }
      if (filters.max_price) {
        dbQuery = dbQuery.lte("assignment_price", filters.max_price);
      }
      if (filters.min_price) {
        dbQuery = dbQuery.gte("assignment_price", filters.min_price);
      }
      if (filters.min_sqft) {
        dbQuery = dbQuery.gte("interior_sqft", filters.min_sqft);
      }
      if (filters.completion_year) {
        dbQuery = dbQuery.eq("completion_year", filters.completion_year);
      }

      const { data: listings, error: dbError } = await dbQuery.limit(12);

      if (dbError) {
        console.error("Database error:", dbError);
        throw new Error("Failed to search assignments");
      }

      const resultCount = listings?.length || 0;

      if (resultCount === 0) {
        const constraints: string[] = [];
        if (filters.city) constraints.push(`in ${filters.city}`);
        if (filters.property_type) constraints.push(`${filters.property_type}s`);
        if (filters.beds !== undefined) constraints.push(`${filters.beds} bedroom${filters.beds !== 1 ? "s" : ""}`);
        if (filters.max_price) constraints.push(`under $${(filters.max_price / 1000).toFixed(0)}K`);
        if (filters.min_sqft) constraints.push(`${filters.min_sqft}+ sqft`);

        explanation = isFollowup 
          ? `No assignments match your refined criteria${constraints.length > 0 ? ` (${constraints.join(", ")})` : ""}. `
          : `No assignments currently match all your criteria${constraints.length > 0 ? ` (${constraints.join(", ")})` : ""}. `;
        
        if (filters.max_price) {
          explanation += "Consider expanding your price range for more options.";
        }
      } else {
        const parts: string[] = [];
        if (filters.city) parts.push(`in ${filters.city}`);
        if (filters.property_type) parts.push(`${filters.property_type}s`);
        if (filters.beds !== undefined) parts.push(`${filters.beds} bed${filters.beds !== 1 ? "s" : ""}`);
        if (filters.max_price) parts.push(`under $${(filters.max_price / 1000).toFixed(0)}K`);

        const prefix = isFollowup ? "Updated results: " : "";
        explanation = `${prefix}Showing ${resultCount} assignment${resultCount > 1 ? "s" : ""} ${parts.length > 0 ? parts.join(" ") : "matching your search"}.`;
      }

      // Add match reasons to each listing
      resultsWithReasons = (listings || []).map((listing: any) => {
        const reasons: string[] = [];
        
        if (filters.city && listing.city?.toLowerCase().includes(filters.city.toLowerCase())) {
          reasons.push(`Located in ${listing.city}`);
        }
        if (filters.max_price && listing.assignment_price) {
          reasons.push(`$${(listing.assignment_price / 1000).toFixed(0)}K`);
        }
        if (filters.beds !== undefined && listing.beds === filters.beds) {
          reasons.push(`${listing.beds} bed${listing.beds !== 1 ? "s" : ""}`);
        }
        if (listing.interior_sqft) {
          reasons.push(`${listing.interior_sqft} sqft`);
        }

        // Get first photo
        const photos = listing.listing_photos?.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)) || [];
        const featured_image = photos[0]?.url || null;

        return {
          ...listing,
          featured_image,
          match_reasons: reasons.length > 0 ? reasons : ["Matches your search criteria"]
        };
      });

      const result: SearchResult = {
        listings: resultsWithReasons,
        explanation,
        filters_applied: filters,
        clarification_needed: clarificationNeeded,
        conversation_context: searchSummary,
        search_mode: "assignments"
      };

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      // Query presale_projects table for projects
      let dbQuery = supabase
        .from("presale_projects")
        .select("id, name, slug, city, neighborhood, project_type, starting_price, deposit_percent, completion_year, completion_month, status, featured_image, short_description, near_skytrain, unit_mix")
        .eq("is_published", true)
        .order("view_count", { ascending: false });

      // Apply filters
      if (filters.city) {
        dbQuery = dbQuery.ilike("city", `%${filters.city}%`);
      }
      if (filters.neighborhood) {
        dbQuery = dbQuery.ilike("neighborhood", `%${filters.neighborhood}%`);
      }
      if (filters.project_type) {
        dbQuery = dbQuery.eq("project_type", filters.project_type);
      }
      if (filters.max_price) {
        dbQuery = dbQuery.lte("starting_price", filters.max_price);
      }
      if (filters.min_price) {
        dbQuery = dbQuery.gte("starting_price", filters.min_price);
      }
      if (filters.max_deposit_percent) {
        dbQuery = dbQuery.lte("deposit_percent", filters.max_deposit_percent);
      }
      if (filters.completion_year) {
        dbQuery = dbQuery.eq("completion_year", filters.completion_year);
      }
      if (filters.near_skytrain) {
        dbQuery = dbQuery.eq("near_skytrain", true);
      }

      const { data: projects, error: dbError } = await dbQuery.limit(12);

      if (dbError) {
        console.error("Database error:", dbError);
        throw new Error("Failed to search projects");
      }

      const projectCount = projects?.length || 0;

      if (projectCount === 0) {
        const constraints: string[] = [];
        if (filters.city) constraints.push(`in ${filters.city}`);
        if (filters.project_type) constraints.push(`${filters.project_type}s`);
        if (filters.max_price) constraints.push(`under $${(filters.max_price / 1000).toFixed(0)}K`);
        if (filters.max_deposit_percent) constraints.push(`with ${filters.max_deposit_percent}% deposit or less`);
        if (filters.completion_year) constraints.push(`completing in ${filters.completion_year}`);
        if (filters.near_skytrain) constraints.push(`near SkyTrain`);

        explanation = isFollowup 
          ? `No projects match your refined criteria${constraints.length > 0 ? ` (${constraints.join(", ")})` : ""}. `
          : `No projects currently match all your criteria${constraints.length > 0 ? ` (${constraints.join(", ")})` : ""}. `;
        
        if (filters.max_deposit_percent && filters.max_deposit_percent <= 10) {
          explanation += "Most presale projects require 15-20% deposits. Try increasing your deposit budget. ";
        }
        if (filters.max_price) {
          explanation += "Consider expanding your price range for more options.";
        }
        if (filters.near_skytrain) {
          explanation += "Try removing the SkyTrain requirement for more options.";
        }
      } else {
        const parts: string[] = [];
        if (filters.city) parts.push(`in ${filters.city}`);
        if (filters.project_type) parts.push(`${filters.project_type}s`);
        if (filters.max_price) parts.push(`under $${(filters.max_price / 1000).toFixed(0)}K`);
        if (filters.max_deposit_percent) parts.push(`with ${filters.max_deposit_percent}% deposit or less`);
        if (filters.near_skytrain) parts.push(`near SkyTrain`);

        const prefix = isFollowup ? "Updated results: " : "";
        explanation = `${prefix}Showing ${projectCount} project${projectCount > 1 ? "s" : ""} ${parts.length > 0 ? parts.join(" ") : "matching your search"}.`;
      }

      // Add match reasons to each project
      resultsWithReasons = (projects || []).map((project: any) => {
        const reasons: string[] = [];
        
        if (filters.city && project.city?.toLowerCase().includes(filters.city.toLowerCase())) {
          reasons.push(`Located in ${project.city}`);
        }
        if (filters.max_price && project.starting_price) {
          reasons.push(`Starting from $${(project.starting_price / 1000).toFixed(0)}K`);
        }
        if (filters.max_deposit_percent && project.deposit_percent) {
          reasons.push(`${project.deposit_percent}% deposit`);
        }
        if (project.near_skytrain && filters.near_skytrain) {
          reasons.push("Near SkyTrain");
        }

        return {
          ...project,
          match_reasons: reasons.length > 0 ? reasons : ["Matches your search criteria"]
        };
      });

      const result: SearchResult = {
        projects: resultsWithReasons,
        explanation,
        filters_applied: filters,
        clarification_needed: clarificationNeeded,
        conversation_context: searchSummary,
        search_mode: "projects"
      };

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error: any) {
    console.error("AI search error:", error);
    
    if (error.message?.includes("rate limit") || error.status === 429) {
      return new Response(
        JSON.stringify({ error: "Search is busy. Please try again in a moment." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: error.message || "Search failed. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
