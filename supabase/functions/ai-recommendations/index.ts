import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://presaleproperties.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ClientActivity {
  activity_type: string;
  listing_key: string | null;
  project_id: string | null;
  project_name: string | null;
  city: string | null;
  price: number | null;
  property_type: string | null;
  created_at: string;
}

interface PropertyProfile {
  cities: Record<string, number>;
  priceRange: { min: number; max: number; avg: number };
  propertyTypes: Record<string, number>;
  neighborhoods: Record<string, number>;
  bedrooms: Record<number, number>;
  highIntentProperties: { type: string; id: string; name: string; score: number }[];
}

interface RecommendedProperty {
  type: "resale" | "presale";
  id: string;
  name: string;
  address: string;
  city: string;
  price: number;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  image: string | null;
  url: string;
  matchScore: number;
  matchReasons: string[];
}

const ACTIVITY_WEIGHTS: Record<string, number> = {
  favorite_add: 10,
  favorite: 10,
  floorplan_download: 8,
  showing_request: 15,
  form_submit: 12,
  floorplan_view: 5,
  property_view: 2,
  calculator_used: 6,
  page_view: 1,
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { client_id, limit = 10 } = await req.json();

    if (!client_id) {
      return new Response(JSON.stringify({ error: "client_id is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`Generating AI recommendations for client: ${client_id}`);

    // Fetch client activity from the last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data: activities, error: activityError } = await supabase
      .from("client_activity")
      .select("activity_type, listing_key, project_id, project_name, city, price, property_type, created_at")
      .eq("client_id", client_id)
      .gte("created_at", ninetyDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(500);

    if (activityError) {
      console.error("Error fetching activity:", activityError);
      throw activityError;
    }

    // Fetch client preferences from the clients table
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("preferred_cities, preferred_property_types, price_min, price_max, beds_min, beds_max")
      .eq("id", client_id)
      .single();

    if (clientError && clientError.code !== "PGRST116") {
      console.error("Error fetching client:", clientError);
    }

    // Build a property profile from activity
    const profile = buildPropertyProfile(activities || [], client);
    console.log("Built property profile:", JSON.stringify(profile, null, 2));

    // If no meaningful activity, return empty
    if (Object.keys(profile.cities).length === 0 && profile.highIntentProperties.length === 0) {
      console.log("No meaningful activity found for recommendations");
      return new Response(JSON.stringify({ recommendations: [], profile: null }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Fetch candidate properties
    const candidates = await fetchCandidateProperties(supabase, profile, limit * 3);
    console.log(`Found ${candidates.length} candidate properties`);

    // Use AI to rank and select best matches
    let recommendations: RecommendedProperty[];

    if (lovableApiKey && candidates.length > 0) {
      recommendations = await getAIRankedRecommendations(
        lovableApiKey,
        profile,
        candidates,
        limit
      );
    } else {
      // Fallback to rule-based scoring
      recommendations = scoreAndRankProperties(profile, candidates, limit);
    }

    console.log(`Returning ${recommendations.length} recommendations`);

    return new Response(
      JSON.stringify({
        recommendations,
        profile: {
          topCities: Object.entries(profile.cities)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([city]) => city),
          priceRange: profile.priceRange,
          preferredTypes: Object.entries(profile.propertyTypes)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2)
            .map(([type]) => type),
          activityCount: activities?.length || 0,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in ai-recommendations:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

function buildPropertyProfile(activities: ClientActivity[], client: any): PropertyProfile {
  const cities: Record<string, number> = {};
  const propertyTypes: Record<string, number> = {};
  const neighborhoods: Record<string, number> = {};
  const bedrooms: Record<number, number> = {};
  const prices: number[] = [];
  const highIntentProperties: { type: string; id: string; name: string; score: number }[] = [];

  // Apply client preferences as base weights
  if (client?.preferred_cities) {
    for (const city of client.preferred_cities) {
      cities[city] = (cities[city] || 0) + 5;
    }
  }
  if (client?.preferred_property_types) {
    for (const type of client.preferred_property_types) {
      propertyTypes[type] = (propertyTypes[type] || 0) + 5;
    }
  }

  // Process activity
  for (const activity of activities) {
    const weight = ACTIVITY_WEIGHTS[activity.activity_type] || 1;

    // Track cities
    if (activity.city) {
      cities[activity.city] = (cities[activity.city] || 0) + weight;
    }

    // Track property types
    if (activity.property_type) {
      propertyTypes[activity.property_type] = (propertyTypes[activity.property_type] || 0) + weight;
    }

    // Track prices
    if (activity.price && activity.price > 0) {
      prices.push(activity.price);
    }

    // Track high-intent properties (favorites, downloads, showings)
    if (weight >= 8) {
      const id = activity.listing_key || activity.project_id;
      const type = activity.listing_key ? "resale" : "presale";
      if (id) {
        const existing = highIntentProperties.find((p) => p.id === id);
        if (existing) {
          existing.score += weight;
        } else {
          highIntentProperties.push({
            type,
            id,
            name: activity.project_name || id,
            score: weight,
          });
        }
      }
    }
  }

  // Calculate price range
  let priceRange = { min: 0, max: 0, avg: 0 };
  if (prices.length > 0) {
    prices.sort((a, b) => a - b);
    priceRange = {
      min: prices[Math.floor(prices.length * 0.1)] || prices[0],
      max: prices[Math.floor(prices.length * 0.9)] || prices[prices.length - 1],
      avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
    };
  } else if (client?.price_min || client?.price_max) {
    priceRange = {
      min: client.price_min || 300000,
      max: client.price_max || 2000000,
      avg: Math.round(((client.price_min || 300000) + (client.price_max || 2000000)) / 2),
    };
  }

  // Sort high-intent by score
  highIntentProperties.sort((a, b) => b.score - a.score);

  return {
    cities,
    priceRange,
    propertyTypes,
    neighborhoods,
    bedrooms,
    highIntentProperties: highIntentProperties.slice(0, 10),
  };
}

async function fetchCandidateProperties(
  supabase: any,
  profile: PropertyProfile,
  limit: number
): Promise<RecommendedProperty[]> {
  const candidates: RecommendedProperty[] = [];
  const topCities = Object.entries(profile.cities)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([city]) => city);

  // Fetch resale listings
  let resaleQuery = supabase
    .from("mls_listings")
    .select("listing_key, listing_price, city, neighborhood, street_number, street_name, street_suffix, property_type, bedrooms_total, bathrooms_total, living_area, photos")
    .eq("mls_status", "Active")
    .gte("year_built", 2020);

  if (topCities.length > 0) {
    resaleQuery = resaleQuery.in("city", topCities);
  }
  if (profile.priceRange.min > 0) {
    resaleQuery = resaleQuery.gte("listing_price", profile.priceRange.min * 0.8);
  }
  if (profile.priceRange.max > 0) {
    resaleQuery = resaleQuery.lte("listing_price", profile.priceRange.max * 1.2);
  }

  resaleQuery = resaleQuery.order("list_date", { ascending: false }).limit(Math.ceil(limit / 2));

  const { data: resaleListings } = await resaleQuery;

  if (resaleListings) {
    for (const listing of resaleListings) {
      const photos = listing.photos as any[];
      candidates.push({
        type: "resale",
        id: listing.listing_key,
        name: `${listing.street_number} ${listing.street_name} ${listing.street_suffix || ""}`.trim(),
        address: `${listing.city}, ${listing.neighborhood || ""}`.trim(),
        city: listing.city,
        price: listing.listing_price,
        beds: listing.bedrooms_total,
        baths: listing.bathrooms_total,
        sqft: listing.living_area,
        image: photos?.[0]?.MediaURL || null,
        url: `https://presaleproperties.ca/resale/${listing.listing_key}`,
        matchScore: 0,
        matchReasons: [],
      });
    }
  }

  // Fetch presale projects
  let presaleQuery = supabase
    .from("presale_projects")
    .select("id, name, slug, city, neighborhood, starting_price, project_type, featured_image")
    .eq("is_published", true);

  if (topCities.length > 0) {
    presaleQuery = presaleQuery.in("city", topCities);
  }
  if (profile.priceRange.min > 0) {
    presaleQuery = presaleQuery.gte("starting_price", profile.priceRange.min * 0.7);
  }
  if (profile.priceRange.max > 0) {
    presaleQuery = presaleQuery.lte("starting_price", profile.priceRange.max * 1.3);
  }

  presaleQuery = presaleQuery.order("published_at", { ascending: false }).limit(Math.ceil(limit / 2));

  const { data: presaleProjects } = await presaleQuery;

  if (presaleProjects) {
    for (const project of presaleProjects) {
      candidates.push({
        type: "presale",
        id: project.id,
        name: project.name,
        address: `${project.city}, ${project.neighborhood || ""}`.trim(),
        city: project.city,
        price: project.starting_price,
        beds: null,
        baths: null,
        sqft: null,
        image: project.featured_image,
        url: `https://presaleproperties.ca/presale-projects/${project.slug}`,
        matchScore: 0,
        matchReasons: [],
      });
    }
  }

  return candidates;
}

async function getAIRankedRecommendations(
  apiKey: string,
  profile: PropertyProfile,
  candidates: RecommendedProperty[],
  limit: number
): Promise<RecommendedProperty[]> {
  const topCities = Object.entries(profile.cities)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([city, score]) => `${city} (interest score: ${score})`);

  const topTypes = Object.entries(profile.propertyTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([type, score]) => `${type} (score: ${score})`);

  const highIntent = profile.highIntentProperties
    .slice(0, 5)
    .map((p) => `${p.name} (${p.type}, score: ${p.score})`);

  const systemPrompt = `You are a real estate recommendation AI. Analyze the buyer's profile and rank properties by relevance.

BUYER PROFILE:
- Preferred cities: ${topCities.join(", ") || "Not specified"}
- Price range: $${profile.priceRange.min?.toLocaleString() || "?"} - $${profile.priceRange.max?.toLocaleString() || "?"}
- Preferred property types: ${topTypes.join(", ") || "Not specified"}
- High-interest properties (favorited/downloaded): ${highIntent.join("; ") || "None"}

Rank the candidate properties and provide match reasons. Consider:
1. Location match (same city = high priority)
2. Price alignment with their browsing history
3. Property type preferences
4. Similar to high-intent properties they've shown interest in`;

  const candidateList = candidates.map((c, i) => ({
    index: i,
    name: c.name,
    city: c.city,
    price: c.price,
    type: c.type,
    beds: c.beds,
  }));

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Here are ${candidates.length} candidate properties. Return the top ${limit} ranked by relevance with match reasons.\n\n${JSON.stringify(candidateList, null, 2)}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "rank_properties",
              description: "Return ranked property recommendations with match scores and reasons",
              parameters: {
                type: "object",
                properties: {
                  rankings: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        index: { type: "number", description: "Index of the property in the candidate list" },
                        matchScore: { type: "number", description: "Match score 0-100" },
                        matchReasons: {
                          type: "array",
                          items: { type: "string" },
                          description: "2-3 short reasons why this property matches",
                        },
                      },
                      required: ["index", "matchScore", "matchReasons"],
                    },
                  },
                },
                required: ["rankings"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "rank_properties" } },
      }),
    });

    if (!response.ok) {
      console.error("AI API error:", response.status, await response.text());
      return scoreAndRankProperties(profile, candidates, limit);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      console.log("No tool call in response, falling back to rule-based");
      return scoreAndRankProperties(profile, candidates, limit);
    }

    const rankings = JSON.parse(toolCall.function.arguments).rankings;
    const recommendations: RecommendedProperty[] = [];

    for (const rank of rankings.slice(0, limit)) {
      if (rank.index >= 0 && rank.index < candidates.length) {
        const prop = candidates[rank.index];
        prop.matchScore = rank.matchScore;
        prop.matchReasons = rank.matchReasons;
        recommendations.push(prop);
      }
    }

    return recommendations;
  } catch (error) {
    console.error("AI ranking error:", error);
    return scoreAndRankProperties(profile, candidates, limit);
  }
}

function scoreAndRankProperties(
  profile: PropertyProfile,
  candidates: RecommendedProperty[],
  limit: number
): RecommendedProperty[] {
  const scored = candidates.map((prop) => {
    let score = 0;
    const reasons: string[] = [];

    // City match (0-40 points)
    const cityScore = profile.cities[prop.city] || 0;
    if (cityScore > 0) {
      score += Math.min(40, cityScore * 2);
      reasons.push(`Matches your interest in ${prop.city}`);
    }

    // Price match (0-30 points)
    if (profile.priceRange.avg > 0 && prop.price) {
      const priceDiff = Math.abs(prop.price - profile.priceRange.avg) / profile.priceRange.avg;
      if (priceDiff < 0.1) {
        score += 30;
        reasons.push("Price aligns with your browsing history");
      } else if (priceDiff < 0.25) {
        score += 20;
        reasons.push("Within your typical price range");
      } else if (priceDiff < 0.4) {
        score += 10;
      }
    }

    // Property type match (0-20 points)
    const typeScore = profile.propertyTypes[prop.type] || 0;
    if (typeScore > 0) {
      score += Math.min(20, typeScore);
      reasons.push(`${prop.type === "presale" ? "New construction" : "Move-in ready"} preference`);
    }

    // Similar to high-intent properties (0-10 points)
    const sameTypeHighIntent = profile.highIntentProperties.filter((p) => p.type === prop.type);
    if (sameTypeHighIntent.length > 0) {
      score += 10;
      reasons.push("Similar to properties you've favorited");
    }

    return {
      ...prop,
      matchScore: Math.min(100, score),
      matchReasons: reasons.slice(0, 3),
    };
  });

  return scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, limit);
}

serve(handler);
