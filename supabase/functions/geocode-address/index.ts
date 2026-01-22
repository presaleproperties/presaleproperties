import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");
    
    if (!GOOGLE_MAPS_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Google Maps API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { address, action, placeId } = await req.json();

    if (!address && action !== "placeDetails") {
      return new Response(
        JSON.stringify({ error: "Address is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "autocomplete") {
      // Google Places API (New) - Autocomplete
      // Max 5 types allowed - use geocode for addresses + establishment for businesses
      const response = await fetch(
        "https://places.googleapis.com/v1/places:autocomplete",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
          },
          body: JSON.stringify({
            input: address,
            // Limited to 5 types max - these cover addresses and business names
            includedPrimaryTypes: [
              "street_address",
              "premise",
              "establishment",
              "point_of_interest",
              "geocode",
            ],
            includedRegionCodes: ["ca"],
            locationBias: {
              rectangle: {
                low: { latitude: 48.3, longitude: -139.1 },
                high: { latitude: 60.0, longitude: -114.0 },
              },
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Google Places API error:", errorData);
        return new Response(
          JSON.stringify({ error: errorData.error?.message || "Failed to fetch suggestions" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = await response.json();

      const predictions = data.suggestions?.map((s: any) => ({
        description: s.placePrediction?.text?.text || "",
        placeId: s.placePrediction?.placeId || "",
      })).filter((p: any) => p.description && p.placeId) || [];

      return new Response(
        JSON.stringify({ predictions }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (action === "geocode") {
      // Use Geocoding API (still supported as separate API)
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`
      );

      if (!response.ok) {
        throw new Error(`Google API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.status !== "OK") {
        console.error("Google Geocoding API error:", data);
        return new Response(
          JSON.stringify({ error: data.error_message || "No results found" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const result = data.results[0];
      const location = result?.geometry?.location;

      if (!location) {
        return new Response(
          JSON.stringify({ error: "Could not find coordinates for this address" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Extract address components
      const addressComponents = result.address_components || [];
      const getComponent = (type: string) => 
        addressComponents.find((c: any) => c.types.includes(type))?.long_name || "";

      return new Response(
        JSON.stringify({
          lat: location.lat,
          lng: location.lng,
          formattedAddress: result.formatted_address,
          city: getComponent("locality") || getComponent("administrative_area_level_2"),
          neighborhood: getComponent("neighborhood") || getComponent("sublocality"),
          streetNumber: getComponent("street_number"),
          streetName: getComponent("route"),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (action === "placeDetails") {
      // Google Places API (New) - Place Details
      if (!placeId) {
        return new Response(
          JSON.stringify({ error: "Place ID is required for placeDetails" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const response = await fetch(
        `https://places.googleapis.com/v1/places/${placeId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
            "X-Goog-FieldMask": "location,formattedAddress,addressComponents",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Google Places Details API error:", errorData);
        return new Response(
          JSON.stringify({ error: errorData.error?.message || "Failed to get place details" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = await response.json();
      const location = data.location;
      const addressComponents = data.addressComponents || [];
      
      const getComponent = (type: string) => {
        const component = addressComponents.find((c: any) => c.types?.includes(type));
        return component?.longText || "";
      };

      return new Response(
        JSON.stringify({
          lat: location?.latitude,
          lng: location?.longitude,
          formattedAddress: data.formattedAddress,
          city: getComponent("locality") || getComponent("administrative_area_level_2"),
          neighborhood: getComponent("neighborhood") || getComponent("sublocality"),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use 'autocomplete', 'geocode', or 'placeDetails'" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in geocode-address function:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
