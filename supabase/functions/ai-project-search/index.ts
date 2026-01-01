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
  unit_type?: string;
  max_price?: number;
  min_price?: number;
  max_deposit_percent?: number;
  completion_year?: number;
  buyer_intent?: string;
  near_skytrain?: boolean;
}

interface SearchResult {
  projects: any[];
  explanation: string;
  filters_applied: ParsedFilters;
  clarification_needed?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    
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

    // Step 1: Use AI to parse the natural language query into structured filters
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
            content: `You are a real estate search assistant for BC presale properties. Parse user queries into structured filters.

Available cities: Vancouver, Burnaby, Surrey, Langley, Coquitlam, Richmond, New Westminster, Port Moody, Delta, Abbotsford
Project types: condo, townhouse
Unit types: studio, 1bed, 2bed, 3bed, 4bed+

Extract filters from the user's query. If the query is too vague, suggest a clarifying question.
For prices, interpret "around $X" as ±15% range. "Under $X" means max_price = X.
For deposits, "10% deposit" means max_deposit_percent = 10.

IMPORTANT: Only extract information explicitly mentioned. Do not assume or invent data.`
          },
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
              description: "Extract structured search filters from natural language query",
              parameters: {
                type: "object",
                properties: {
                  filters: {
                    type: "object",
                    properties: {
                      city: { type: "string", description: "City name (e.g., Langley, Vancouver)" },
                      neighborhood: { type: "string", description: "Specific neighborhood if mentioned" },
                      project_type: { type: "string", enum: ["condo", "townhouse"] },
                      unit_type: { type: "string", enum: ["studio", "1bed", "2bed", "3bed", "4bed+"] },
                      max_price: { type: "number", description: "Maximum price in dollars" },
                      min_price: { type: "number", description: "Minimum price in dollars" },
                      max_deposit_percent: { type: "number", description: "Maximum deposit percentage (e.g., 10 for 10%)" },
                      completion_year: { type: "number", description: "Expected completion year" },
                      near_skytrain: { type: "boolean", description: "Must be near SkyTrain" },
                      buyer_intent: { type: "string", description: "Buyer type: first-time, investor, family" }
                    },
                    additionalProperties: false
                  },
                  clarification_needed: { 
                    type: "string", 
                    description: "If query is too vague, ask ONE clarifying question" 
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

    console.log("Parsed filters:", filters);
    console.log("Clarification:", clarificationNeeded);

    // If clarification is needed and no concrete filters, return early
    if (clarificationNeeded && Object.keys(filters).length === 0) {
      return new Response(
        JSON.stringify({
          projects: [],
          explanation: clarificationNeeded,
          filters_applied: filters,
          clarification_needed: clarificationNeeded
        } as SearchResult),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Query the database with extracted filters
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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

    // Step 3: Generate explanation
    let explanation = "";
    const projectCount = projects?.length || 0;

    if (projectCount === 0) {
      // Build explanation for no results
      const constraints: string[] = [];
      if (filters.city) constraints.push(`in ${filters.city}`);
      if (filters.project_type) constraints.push(`${filters.project_type}s`);
      if (filters.max_price) constraints.push(`under $${(filters.max_price / 1000).toFixed(0)}K`);
      if (filters.max_deposit_percent) constraints.push(`with ${filters.max_deposit_percent}% deposit or less`);
      if (filters.completion_year) constraints.push(`completing in ${filters.completion_year}`);

      explanation = `No projects currently match all your criteria${constraints.length > 0 ? ` (${constraints.join(", ")})` : ""}. `;
      
      // Suggest relaxing constraints
      if (filters.max_deposit_percent && filters.max_deposit_percent <= 10) {
        explanation += "Most presale projects require 15-20% deposits. Try increasing your deposit budget. ";
      }
      if (filters.max_price) {
        explanation += "Consider expanding your price range for more options.";
      }
    } else {
      // Build success explanation
      const parts: string[] = [];
      if (filters.city) parts.push(`in ${filters.city}`);
      if (filters.project_type) parts.push(`${filters.project_type}s`);
      if (filters.max_price) parts.push(`under $${(filters.max_price / 1000).toFixed(0)}K`);
      if (filters.max_deposit_percent) parts.push(`with ${filters.max_deposit_percent}% deposit or less`);

      explanation = `Showing ${projectCount} project${projectCount > 1 ? "s" : ""} ${parts.length > 0 ? parts.join(" ") : "matching your search"}.`;
    }

    // Add match reasons to each project
    const projectsWithReasons = (projects || []).map((project: any) => {
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
      projects: projectsWithReasons,
      explanation,
      filters_applied: filters,
      clarification_needed: clarificationNeeded
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

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
