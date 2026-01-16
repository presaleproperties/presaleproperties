import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type BehaviorEventPayload = Record<string, unknown> & {
  event_id?: string;
  event_name?: string;
  timestamp?: string;
  visitor_id?: string;
  session_id?: string;
  page_path?: string;
  page_title?: string;
  device_type?: string;
  event_payload?: {
    project_id?: string;
    project_name?: string;
    city?: string;
    price_from?: number;
    listing_key?: string;
    [key: string]: unknown;
  };
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: BehaviorEventPayload = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Track client activity if we have a visitor_id
    let leadDetails: Record<string, unknown> | null = null;
    let isKnownLead = false;

    if (payload.visitor_id && payload.event_name) {
      // Check if this visitor is a known client
      const { data: existingClient } = await supabase
        .from("clients")
        .select("id, email, first_name, last_name, phone, preferred_cities, total_property_views, total_site_visits, intent_score")
        .eq("visitor_id", payload.visitor_id)
        .single();

      // Also check project_leads for this visitor
      const { data: existingLead } = await supabase
        .from("project_leads")
        .select("id, name, email, phone, project_name, city, persona, home_size, is_realtor, created_at")
        .eq("visitor_id", payload.visitor_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Build activity record
      const eventPayload = payload.event_payload || {};
      const activityData: Record<string, unknown> = {
        visitor_id: payload.visitor_id,
        activity_type: payload.event_name,
        listing_key: eventPayload.listing_key,
        project_id: eventPayload.project_id,
        project_name: eventPayload.project_name,
        city: eventPayload.city,
        price: eventPayload.price_from,
        page_url: payload.page_path,
        page_title: payload.page_title,
        device_type: payload.device_type,
      };

      // Link to client if known
      if (existingClient) {
        isKnownLead = true;
        activityData.client_id = existingClient.id;
        leadDetails = {
          source: "client",
          email: existingClient.email,
          first_name: existingClient.first_name,
          last_name: existingClient.last_name,
          full_name: [existingClient.first_name, existingClient.last_name].filter(Boolean).join(" "),
          phone: existingClient.phone,
          preferred_cities: existingClient.preferred_cities,
          intent_score: existingClient.intent_score,
          total_property_views: existingClient.total_property_views,
          total_site_visits: existingClient.total_site_visits,
        };

        // Update client stats
        const updates: Record<string, unknown> = {
          last_seen_at: new Date().toISOString(),
        };

        if (payload.event_name === "property_view") {
          updates.total_property_views = (existingClient.total_property_views || 0) + 1;
          updates.intent_score = (existingClient.intent_score || 0) + 1;
        } else if (payload.event_name === "page_view") {
          updates.total_site_visits = (existingClient.total_site_visits || 0) + 1;
        } else if (payload.event_name === "floorplan_view") {
          updates.intent_score = (existingClient.intent_score || 0) + 3;
        } else if (payload.event_name === "floorplan_download") {
          updates.intent_score = (existingClient.intent_score || 0) + 8;
        } else if (payload.event_name === "favorite_add") {
          updates.intent_score = (existingClient.intent_score || 0) + 5;
        }

        await supabase.from("clients").update(updates).eq("id", existingClient.id);
      } else if (existingLead) {
        // Lead exists in project_leads but not in clients
        isKnownLead = true;
        leadDetails = {
          source: "project_lead",
          email: existingLead.email,
          full_name: existingLead.name,
          phone: existingLead.phone,
          original_project: existingLead.project_name,
          original_city: existingLead.city,
          persona: existingLead.persona,
          home_size: existingLead.home_size,
          is_realtor: existingLead.is_realtor,
          lead_created_at: existingLead.created_at,
        };
      }

      // Insert activity (errors are non-blocking)
      try {
        await supabase.from("client_activity").insert(activityData);
      } catch {
        // Ignore errors
      }
    }

    // Forward to Zapier webhook if configured
    const { data: webhookSetting, error: webhookError } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "zapier_behavior_webhook")
      .maybeSingle();

    if (webhookError) {
      console.error("Failed to fetch zapier_behavior_webhook:", webhookError);
      return new Response(JSON.stringify({ success: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const webhookUrl = typeof webhookSetting?.value === "string" ? webhookSetting.value : null;

    if (!webhookUrl || !webhookUrl.trim()) {
      console.log("No zapier_behavior_webhook configured; skipping.");
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Enrich payload with lead details if this is a known lead
    const enrichedPayload = {
      ...payload,
      is_known_lead: isKnownLead,
      lead_details: leadDetails,
    };

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(enrichedPayload),
    });

    if (!res.ok) {
      console.error("Zapier behavior webhook failed:", res.status, await res.text());
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in send-behavior-event:", error);
    return new Response(JSON.stringify({ success: false }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});