import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    const payload: ActivityPayload = await req.json();
    
    if (!payload.visitor_id || !payload.activity_type) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Try to find existing client by visitor_id
    const { data: existingClient } = await supabase
      .from("clients")
      .select("id, total_property_views, total_site_visits, intent_score")
      .eq("visitor_id", payload.visitor_id)
      .single();

    // Insert activity record
    const activityData: any = {
      visitor_id: payload.visitor_id,
      activity_type: payload.activity_type,
      listing_key: payload.listing_key,
      project_id: payload.project_id,
      project_name: payload.project_name,
      property_type: payload.property_type,
      city: payload.city,
      price: payload.price,
      page_url: payload.page_url,
      page_title: payload.page_title,
      duration_seconds: payload.duration_seconds,
      referrer: payload.referrer,
      utm_source: payload.utm_source,
      utm_medium: payload.utm_medium,
      utm_campaign: payload.utm_campaign,
      device_type: payload.device_type,
    };

    // If we found a client, link the activity
    if (existingClient) {
      activityData.client_id = existingClient.id;

      // Update client stats
      const updates: any = {
        last_seen_at: new Date().toISOString(),
      };

      if (payload.activity_type === "property_view") {
        updates.total_property_views = (existingClient.total_property_views || 0) + 1;
        updates.intent_score = (existingClient.intent_score || 0) + 1;
      } else if (payload.activity_type === "page_view") {
        updates.total_site_visits = (existingClient.total_site_visits || 0) + 1;
      } else if (payload.activity_type === "floorplan_view") {
        updates.intent_score = (existingClient.intent_score || 0) + 3;
      } else if (payload.activity_type === "floorplan_download") {
        updates.intent_score = (existingClient.intent_score || 0) + 8;
      } else if (payload.activity_type === "favorite") {
        updates.intent_score = (existingClient.intent_score || 0) + 5;
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
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in track-client-activity:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
