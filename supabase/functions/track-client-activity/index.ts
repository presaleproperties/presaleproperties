import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Valid activity types
const VALID_ACTIVITY_TYPES = [
  "page_view",
  "property_view", 
  "floorplan_view",
  "floorplan_download",
  "favorite",
  "unfavorite",
  "contact_form",
  "booking_started",
  "search",
  "filter_change",
  "map_interaction",
  "calculator_use",
  "video_play",
  "share",
];

// Valid property types
const VALID_PROPERTY_TYPES = ["condo", "townhouse", "house", "land", "commercial"];

// Valid device types
const VALID_DEVICE_TYPES = ["desktop", "mobile", "tablet"];

// Input sanitization helpers
function sanitizeString(value: unknown, maxLength = 500): string | undefined {
  if (typeof value !== "string") return undefined;
  return value.slice(0, maxLength).replace(/[<>]/g, '');
}

function sanitizeNumber(value: unknown, min = 0, max = 100000000): number | undefined {
  if (typeof value !== "number" || isNaN(value)) return undefined;
  return Math.max(min, Math.min(max, value));
}

function sanitizeUUID(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value) ? value : undefined;
}

function sanitizeVisitorId(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  // Allow alphanumeric, hyphens, underscores (typical visitor ID format)
  const sanitized = value.slice(0, 100).replace(/[^a-zA-Z0-9\-_]/g, '');
  return sanitized.length >= 8 ? sanitized : undefined;
}

function sanitizeUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  try {
    const url = new URL(value);
    // Only allow http/https
    if (!['http:', 'https:'].includes(url.protocol)) return undefined;
    return value.slice(0, 2000);
  } catch {
    // Allow relative URLs
    if (value.startsWith('/')) {
      return value.slice(0, 500).replace(/[<>]/g, '');
    }
    return undefined;
  }
}

interface ActivityPayload {
  visitor_id: string;
  session_id?: string;
  activity_type: string;
  listing_key?: string;
  project_id?: string;
  project_name?: string;
  property_type?: string;
  city?: string;
  price?: number;
  page_url?: string;
  page_title?: string;
  duration_seconds?: number;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  device_type?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let payload: ActivityPayload;
    try {
      payload = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate and sanitize visitor_id (required)
    const visitor_id = sanitizeVisitorId(payload.visitor_id);
    if (!visitor_id) {
      return new Response(JSON.stringify({ error: "Invalid visitor_id" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate activity_type (required, must be from allowed list)
    const activity_type = VALID_ACTIVITY_TYPES.includes(payload.activity_type) 
      ? payload.activity_type 
      : null;
    if (!activity_type) {
      return new Response(JSON.stringify({ error: "Invalid activity_type" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Sanitize optional fields
    const sanitizedPayload = {
      visitor_id,
      activity_type,
      session_id: sanitizeVisitorId(payload.session_id),
      listing_key: sanitizeString(payload.listing_key, 100),
      project_id: sanitizeUUID(payload.project_id),
      project_name: sanitizeString(payload.project_name, 200),
      property_type: VALID_PROPERTY_TYPES.includes(payload.property_type || '') 
        ? payload.property_type 
        : undefined,
      city: sanitizeString(payload.city, 100),
      price: sanitizeNumber(payload.price, 0, 50000000),
      page_url: sanitizeUrl(payload.page_url),
      page_title: sanitizeString(payload.page_title, 200),
      duration_seconds: sanitizeNumber(payload.duration_seconds, 0, 86400),
      referrer: sanitizeUrl(payload.referrer),
      utm_source: sanitizeString(payload.utm_source, 100),
      utm_medium: sanitizeString(payload.utm_medium, 100),
      utm_campaign: sanitizeString(payload.utm_campaign, 100),
      device_type: VALID_DEVICE_TYPES.includes(payload.device_type || '') 
        ? payload.device_type 
        : undefined,
    };

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Try to find existing client by visitor_id
    const { data: existingClient } = await supabase
      .from("clients")
      .select("id, total_property_views, total_site_visits, intent_score")
      .eq("visitor_id", visitor_id)
      .single();

    // Build activity data object, only including defined values
    const activityData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(sanitizedPayload)) {
      if (value !== undefined) {
        activityData[key] = value;
      }
    }

    // If we found a client, link the activity
    if (existingClient) {
      activityData.client_id = existingClient.id;

      // Update client stats
      const updates: Record<string, unknown> = {
        last_seen_at: new Date().toISOString(),
      };

      if (activity_type === "property_view") {
        updates.total_property_views = (existingClient.total_property_views || 0) + 1;
        updates.intent_score = Math.min(100, (existingClient.intent_score || 0) + 1);
      } else if (activity_type === "page_view") {
        updates.total_site_visits = (existingClient.total_site_visits || 0) + 1;
      } else if (activity_type === "floorplan_view") {
        updates.intent_score = Math.min(100, (existingClient.intent_score || 0) + 3);
      } else if (activity_type === "floorplan_download") {
        updates.intent_score = Math.min(100, (existingClient.intent_score || 0) + 8);
      } else if (activity_type === "favorite") {
        updates.intent_score = Math.min(100, (existingClient.intent_score || 0) + 5);
      }

      await supabase
        .from("clients")
        .update(updates)
        .eq("id", existingClient.id);
    }

    // Insert the activity
    const { error: activityError } = await supabase
      .from("client_activity")
      .insert(activityData);

    if (activityError) {
      console.error("Error inserting activity:", activityError);
      // Don't expose internal errors
      return new Response(JSON.stringify({ error: "Failed to track activity" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error in track-client-activity:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);