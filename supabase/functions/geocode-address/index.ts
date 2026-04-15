import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

const BC_BOUNDS = {
  low: { latitude: 48.3, longitude: -139.1 },
  high: { latitude: 60.0, longitude: -114.0 },
};

const jsonHeaders = (req: Request) => ({
  ...getCorsHeaders(req),
  "Content-Type": "application/json",
});

const toResponse = (req: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: jsonHeaders(req),
  });

const isGoogleConfigError = (message: string) => {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("billing") ||
    normalized.includes("api is not activated") ||
    normalized.includes("api project") ||
    normalized.includes("request_denied")
  );
};

const getMapboxAddressParts = (feature: any) => {
  const context = Array.isArray(feature?.context) ? feature.context : [];
  const allParts = [feature, ...context];

  const getTextByPrefix = (prefixes: string[]) => {
    const match = allParts.find((part: any) => {
      const id = typeof part?.id === "string" ? part.id : "";
      return prefixes.some((prefix) => id.startsWith(prefix));
    });
    return match?.text || match?.place_name || "";
  };

  return {
    city:
      getTextByPrefix(["place", "locality", "district"]) ||
      feature?.text ||
      "",
    neighborhood: getTextByPrefix(["neighborhood", "locality", "district"]),
  };
};

async function mapboxAutocomplete(address: string, token: string) {
  const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json`);
  url.searchParams.set("access_token", token);
  url.searchParams.set("autocomplete", "true");
  url.searchParams.set("limit", "8");
  url.searchParams.set("country", "ca");
  url.searchParams.set("types", "address,place,locality,neighborhood,poi");
  url.searchParams.set("bbox", "-139.1,48.3,-114.0,60.0");

  const response = await fetch(url.toString());
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || `Mapbox autocomplete failed: ${response.status}`);
  }

  return (data?.features || []).map((feature: any) => ({
    description: feature.place_name || feature.text || "",
    placeId: "",
  })).filter((prediction: any) => prediction.description);
}

async function mapboxGeocode(address: string, token: string) {
  const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json`);
  url.searchParams.set("access_token", token);
  url.searchParams.set("autocomplete", "true");
  url.searchParams.set("limit", "1");
  url.searchParams.set("country", "ca");
  url.searchParams.set("types", "address,place,locality,neighborhood,poi");
  url.searchParams.set("bbox", "-139.1,48.3,-114.0,60.0");

  const response = await fetch(url.toString());
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || `Mapbox geocode failed: ${response.status}`);
  }

  const feature = data?.features?.[0];
  const center = feature?.center;

  if (!feature || !Array.isArray(center) || center.length < 2) {
    return null;
  }

  const { city, neighborhood } = getMapboxAddressParts(feature);

  return {
    lat: center[1],
    lng: center[0],
    formattedAddress: feature.place_name || address,
    city,
    neighborhood,
    streetNumber: feature?.address || "",
    streetName: feature?.text || "",
    provider: "mapbox",
    fallback: true,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");
    const MAPBOX_ACCESS_TOKEN = Deno.env.get("MAPBOX_ACCESS_TOKEN");

    const { address, action, placeId } = await req.json();

    if ((!address || typeof address !== "string" || address.trim().length === 0) && action !== "placeDetails") {
      return toResponse(req, { error: "Address is required" }, 400);
    }

    const safeAddress = typeof address === "string" ? address.trim() : "";

    if (action === "autocomplete") {
      if (GOOGLE_MAPS_API_KEY) {
        try {
          const response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
            },
            body: JSON.stringify({
              input: safeAddress,
              includedRegionCodes: ["ca"],
              includeQueryPredictions: true,
              locationBias: { rectangle: BC_BOUNDS },
            }),
          });

          const data = await response.json().catch(() => null);

          if (response.ok) {
            const predictions = (data?.suggestions || [])
              .map((suggestion: any) => {
                const placePrediction = suggestion.placePrediction;
                const queryPrediction = suggestion.queryPrediction;

                if (placePrediction?.text?.text && placePrediction?.placeId) {
                  return {
                    description: placePrediction.text.text,
                    placeId: placePrediction.placeId,
                  };
                }

                if (queryPrediction?.text?.text) {
                  return {
                    description: queryPrediction.text.text,
                    placeId: "",
                  };
                }

                return null;
              })
              .filter((prediction: any) => prediction?.description)
              .slice(0, 8);

            return toResponse(req, { predictions, provider: "google", fallback: false });
          }

          const googleError = data?.error?.message || `Google Places API error: ${response.status}`;
          console.error("Google Places API error:", data);

          if (!MAPBOX_ACCESS_TOKEN) {
            return toResponse(req, { predictions: [], error: googleError, fallback: true, provider: "google" });
          }

          const predictions = await mapboxAutocomplete(safeAddress, MAPBOX_ACCESS_TOKEN);
          return toResponse(req, {
            predictions,
            error: isGoogleConfigError(googleError) ? googleError : undefined,
            fallback: true,
            provider: "mapbox",
          });
        } catch (error) {
          console.error("Autocomplete provider error:", error);
        }
      }

      if (MAPBOX_ACCESS_TOKEN) {
        try {
          const predictions = await mapboxAutocomplete(safeAddress, MAPBOX_ACCESS_TOKEN);
          return toResponse(req, { predictions, fallback: true, provider: "mapbox" });
        } catch (error) {
          console.error("Mapbox autocomplete error:", error);
        }
      }

      return toResponse(req, {
        predictions: [],
        error: "Address suggestions are temporarily unavailable",
        fallback: true,
      });
    }

    if (action === "geocode") {
      if (GOOGLE_MAPS_API_KEY) {
        try {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(safeAddress)}&key=${GOOGLE_MAPS_API_KEY}`
          );
          const data = await response.json().catch(() => null);

          if (response.ok && data?.status === "OK") {
            const result = data.results?.[0];
            const location = result?.geometry?.location;
            const addressComponents = result?.address_components || [];
            const getComponent = (type: string) =>
              addressComponents.find((c: any) => c.types.includes(type))?.long_name || "";

            if (location?.lat && location?.lng) {
              return toResponse(req, {
                lat: location.lat,
                lng: location.lng,
                formattedAddress: result.formatted_address,
                city: getComponent("locality") || getComponent("administrative_area_level_2"),
                neighborhood: getComponent("neighborhood") || getComponent("sublocality"),
                streetNumber: getComponent("street_number"),
                streetName: getComponent("route"),
                provider: "google",
                fallback: false,
              });
            }
          }

          const googleError = data?.error_message || data?.status || `Google Geocoding API error: ${response.status}`;
          console.error("Google Geocoding API error:", data);

          if (!MAPBOX_ACCESS_TOKEN) {
            return toResponse(req, {
              error: googleError,
              fallback: true,
              lat: null,
              lng: null,
            });
          }

          const fallbackResult = await mapboxGeocode(safeAddress, MAPBOX_ACCESS_TOKEN);
          if (fallbackResult) {
            return toResponse(req, fallbackResult);
          }

          return toResponse(req, {
            error: googleError,
            fallback: true,
            lat: null,
            lng: null,
          });
        } catch (error) {
          console.error("Google geocode error:", error);
        }
      }

      if (MAPBOX_ACCESS_TOKEN) {
        try {
          const fallbackResult = await mapboxGeocode(safeAddress, MAPBOX_ACCESS_TOKEN);
          if (fallbackResult) {
            return toResponse(req, fallbackResult);
          }
        } catch (error) {
          console.error("Mapbox geocode error:", error);
        }
      }

      return toResponse(req, {
        error: "Could not find coordinates for this address",
        fallback: true,
        lat: null,
        lng: null,
      });
    }

    if (action === "placeDetails") {
      if (placeId && GOOGLE_MAPS_API_KEY) {
        try {
          const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
              "X-Goog-FieldMask": "location,formattedAddress,addressComponents",
            },
          });
          const data = await response.json().catch(() => null);

          if (response.ok && data?.location?.latitude && data?.location?.longitude) {
            const addressComponents = data.addressComponents || [];
            const getComponent = (type: string) => {
              const component = addressComponents.find((c: any) => c.types?.includes(type));
              return component?.longText || "";
            };

            return toResponse(req, {
              lat: data.location.latitude,
              lng: data.location.longitude,
              formattedAddress: data.formattedAddress,
              city: getComponent("locality") || getComponent("administrative_area_level_2"),
              neighborhood: getComponent("neighborhood") || getComponent("sublocality"),
              provider: "google",
              fallback: false,
            });
          }

          console.error("Google Places Details API error:", data);
        } catch (error) {
          console.error("Google place details error:", error);
        }
      }

      if (safeAddress && MAPBOX_ACCESS_TOKEN) {
        try {
          const fallbackResult = await mapboxGeocode(safeAddress, MAPBOX_ACCESS_TOKEN);
          if (fallbackResult) {
            return toResponse(req, fallbackResult);
          }
        } catch (error) {
          console.error("Mapbox placeDetails fallback error:", error);
        }
      }

      return toResponse(req, {
        error: "Could not get place details for this address",
        fallback: true,
        lat: null,
        lng: null,
      });
    }

    return toResponse(req, { error: "Invalid action. Use 'autocomplete', 'geocode', or 'placeDetails'" }, 400);
  } catch (error: unknown) {
    console.error("Error in geocode-address function:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return toResponse(req, { error: errorMessage, fallback: true, predictions: [] });
  }
});
