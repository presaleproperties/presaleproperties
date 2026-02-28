import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://presaleproperties.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};




// ── Rate Limiting ─────────────────────────────────────────────────────────────
const RL_WINDOW = 3600; // seconds
const RL_MAX = 200;

async function rateLimited(req: Request, funcKey: string): Promise<boolean> {
  try {
    const ip = (req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "anon").split(",")[0].trim();
    const key = `${funcKey}:${ip}`;
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const since = new Date(Date.now() - RL_WINDOW * 1000).toISOString();
    const { count, error } = await sb.from("rate_limit_log")
      .select("id", { count: "exact", head: true })
      .eq("rate_key", key).gte("created_at", since);
    if (error) return false;
    if ((count ?? 0) >= RL_MAX) return true;
    await sb.from("rate_limit_log").insert({ rate_key: key });
    return false;
  } catch { return false; }
}
// ─────────────────────────────────────────────────────────────────────────────

const RATE_LIMIT_MAX = 200; // max 200 requests per IP per hour


// Extract client IP from request headers
function getClientIP(req: Request): string | null {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("cf-connecting-ip")
    || req.headers.get("x-real-ip")
    || null;
}

// Blocked datacenter/bot IP prefixes
const BLOCKED_IP_PREFIXES = [
  "43.173.", "42.106.", "45.83.", "185.220.",
  "194.165.", "167.94.", "216.244."
];

function isBlockedIP(ip: string | null): boolean {
  if (!ip) return false;
  return BLOCKED_IP_PREFIXES.some(prefix => ip.startsWith(prefix));
}

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
  // Rate limit check
  if (await rateLimited(req, "send-behavior-event")) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "3600" }
    });
  }

  }

  try {
    const clientIP = getClientIP(req);

    // Bot/crawler IP filtering — silent 200 to avoid retry escalation
    if (isBlockedIP(clientIP)) {
      console.log(`[BOT_BLOCK] Blocked IP: ${clientIP}`);
      return new Response(JSON.stringify({ success: true, blocked: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

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
        .select("id, name, email, phone, persona, home_size, agent_status, created_at, project_id, presale_projects(name, city)")
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

      // Add IP address to activity record
      if (clientIP) {
        activityData.ip_address = clientIP;
      }

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

        // Update last known IP
        if (clientIP) {
          updates.last_ip = clientIP;
        }

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
        const projectData = existingLead.presale_projects as unknown as { name: string; city: string } | null;
        leadDetails = {
          source: "project_lead",
          email: existingLead.email,
          full_name: existingLead.name,
          phone: existingLead.phone,
          original_project: projectData?.name || null,
          original_city: projectData?.city || null,
          persona: existingLead.persona,
          home_size: existingLead.home_size,
          agent_status: existingLead.agent_status,
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

    // Only forward high-value events to Zapier in real-time
    // Other events are stored in client_activity and sent via daily digest
    const isHighValueEvent = payload.event_name === "form_submit";
    
    if (isHighValueEvent) {
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

      // Guard: only forward if this is a known lead with a valid email
      const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
      const knownEmail = leadDetails?.email?.toString() || null;
      if (!isKnownLead || !knownEmail || !emailRegex.test(knownEmail.trim().toLowerCase())) {
        console.log(`[GUARD] Skipping Zapier behavior event — not a known lead or no valid email: isKnownLead=${isKnownLead}, email=${knownEmail}`);
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (webhookUrl && webhookUrl.trim()) {
        // Enrich payload with lead details if this is a known lead
        const fullName = leadDetails?.full_name?.toString() || "";
        const nameParts = fullName.trim().split(/\s+/);
        const parsedFirstName = leadDetails?.first_name?.toString() || nameParts[0] || null;
        const parsedLastName = leadDetails?.last_name?.toString() || nameParts.slice(1).join(" ") || null;
        
        const enrichedPayload = {
          ...payload,
          ip_address: clientIP,
          is_known_lead: isKnownLead,
          leadId: leadDetails?.email || payload.visitor_id || null,
          leadName: fullName || null,
          firstName: parsedFirstName,
          lastName: parsedLastName,
          email: leadDetails?.email || null,
          phone: leadDetails?.phone || null,
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
      }
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