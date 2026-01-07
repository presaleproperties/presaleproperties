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

    const { address, action } = await req.json();

    if (!address) {
      return new Response(
        JSON.stringify({ error: "Address is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "autocomplete") {
      // Google Places Autocomplete API
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(address)}&types=address&components=country:ca&key=${GOOGLE_MAPS_API_KEY}`
      );

      if (!response.ok) {
        throw new Error(`Google API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
        console.error("Google Places API error:", data);
        return new Response(
          JSON.stringify({ error: data.error_message || "Failed to fetch suggestions" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const predictions = data.predictions?.map((p: any) => ({
        description: p.description,
        placeId: p.place_id,
      })) || [];

      return new Response(
        JSON.stringify({ predictions }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (action === "geocode") {
      // Google Geocoding API
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
      // Get place details by place_id
      const { placeId } = await req.json();
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,formatted_address,address_components&key=${GOOGLE_MAPS_API_KEY}`
      );

      if (!response.ok) {
        throw new Error(`Google API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.status !== "OK") {
        return new Response(
          JSON.stringify({ error: data.error_message || "Failed to get place details" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const result = data.result;
      const location = result?.geometry?.location;
      const addressComponents = result.address_components || [];
      
      const getComponent = (type: string) => 
        addressComponents.find((c: any) => c.types.includes(type))?.long_name || "";

      return new Response(
        JSON.stringify({
          lat: location?.lat,
          lng: location?.lng,
          formattedAddress: result.formatted_address,
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

  } catch (error) {
    console.error("Error in geocode-address function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
