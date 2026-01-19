import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VisitorDigest {
  visitor_id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  is_known_lead: boolean;
  date: string;
  total_page_views: number;
  total_property_views: number;
  properties_viewed: Array<{
    project_name: string | null;
    city: string | null;
    view_count: number;
  }>;
  cities_browsed: string[];
  events_summary: Record<string, number>;
  first_seen: string;
  last_seen: string;
  intent_score: number;
  device_type: string | null;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the date range for yesterday (or custom date from request body)
    let targetDate: string;
    try {
      const body = await req.json().catch(() => ({}));
      targetDate = body.date || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    } catch {
      targetDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    }

    const startOfDay = `${targetDate}T00:00:00.000Z`;
    const endOfDay = `${targetDate}T23:59:59.999Z`;

    console.log(`Generating visitor digest for ${targetDate}`);

    // Fetch all activity for the day
    const { data: activities, error: activitiesError } = await supabase
      .from("client_activity")
      .select("*")
      .gte("created_at", startOfDay)
      .lte("created_at", endOfDay)
      .order("created_at", { ascending: true });

    if (activitiesError) {
      console.error("Failed to fetch activities:", activitiesError);
      throw activitiesError;
    }

    if (!activities || activities.length === 0) {
      console.log("No activities found for the day");
      return new Response(JSON.stringify({ success: true, visitors: 0, message: "No activities" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Group activities by visitor_id
    const visitorActivities: Record<string, typeof activities> = {};
    for (const activity of activities) {
      const vid = activity.visitor_id || "anonymous";
      if (!visitorActivities[vid]) {
        visitorActivities[vid] = [];
      }
      visitorActivities[vid].push(activity);
    }

    // Fetch the Zapier webhook URL
    const { data: webhookSetting } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "zapier_daily_digest_webhook")
      .maybeSingle();

    const webhookUrl = typeof webhookSetting?.value === "string" ? webhookSetting.value : null;

    if (!webhookUrl || !webhookUrl.trim()) {
      console.log("No zapier_daily_digest_webhook configured; skipping.");
      return new Response(JSON.stringify({ success: true, skipped: true, visitors: Object.keys(visitorActivities).length }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build digest for each visitor
    const digests: VisitorDigest[] = [];

    for (const [visitorId, acts] of Object.entries(visitorActivities)) {
      // Check if this visitor is a known lead (has client or project_lead record)
      const { data: client } = await supabase
        .from("clients")
        .select("email, first_name, last_name, phone, intent_score")
        .eq("visitor_id", visitorId)
        .maybeSingle();

      const { data: lead } = await supabase
        .from("project_leads")
        .select("email, name, phone")
        .eq("visitor_id", visitorId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const isKnownLead = !!(client || lead);
      const email = client?.email || lead?.email || null;
      const name = client ? [client.first_name, client.last_name].filter(Boolean).join(" ") : lead?.name || null;
      const phone = client?.phone || lead?.phone || null;

      // Calculate event counts
      const eventsSummary: Record<string, number> = {};
      const propertiesViewed: Record<string, { project_name: string | null; city: string | null; count: number }> = {};
      const citiesBrowsed = new Set<string>();
      let deviceType: string | null = null;

      for (const act of acts) {
        // Count events
        eventsSummary[act.activity_type] = (eventsSummary[act.activity_type] || 0) + 1;

        // Track property views
        if (act.activity_type === "property_view" && act.project_id) {
          if (!propertiesViewed[act.project_id]) {
            propertiesViewed[act.project_id] = {
              project_name: act.project_name,
              city: act.city,
              count: 0,
            };
          }
          propertiesViewed[act.project_id].count++;
        }

        // Track cities
        if (act.city) {
          citiesBrowsed.add(act.city);
        }

        // Get device type from first record
        if (!deviceType && act.device_type) {
          deviceType = act.device_type;
        }
      }

      // Calculate intent score from activities
      let calculatedIntent = 0;
      for (const [eventType, count] of Object.entries(eventsSummary)) {
        switch (eventType) {
          case "property_view":
            calculatedIntent += count * 1;
            break;
          case "floorplan_view":
            calculatedIntent += count * 3;
            break;
          case "floorplan_download":
            calculatedIntent += count * 8;
            break;
          case "favorite_add":
            calculatedIntent += count * 5;
            break;
          case "form_submit":
            calculatedIntent += count * 15;
            break;
          default:
            calculatedIntent += count * 0.5;
        }
      }

      const digest: VisitorDigest = {
        visitor_id: visitorId,
        email,
        name,
        phone,
        is_known_lead: isKnownLead,
        date: targetDate,
        total_page_views: eventsSummary["page_view"] || 0,
        total_property_views: eventsSummary["property_view"] || 0,
        properties_viewed: Object.values(propertiesViewed).map(p => ({ project_name: p.project_name, city: p.city, view_count: p.count })).sort((a, b) => b.view_count - a.view_count).slice(0, 10),
        cities_browsed: Array.from(citiesBrowsed),
        events_summary: eventsSummary,
        first_seen: acts[0]?.created_at || startOfDay,
        last_seen: acts[acts.length - 1]?.created_at || endOfDay,
        intent_score: client?.intent_score || Math.round(calculatedIntent),
        device_type: deviceType,
      };

      digests.push(digest);
    }

    // Sort digests by intent score (highest first)
    digests.sort((a, b) => b.intent_score - a.intent_score);

    // Send digest to Zapier
    const summaryPayload = {
      report_type: "daily_visitor_digest",
      date: targetDate,
      total_visitors: digests.length,
      known_leads: digests.filter(d => d.is_known_lead).length,
      anonymous_visitors: digests.filter(d => !d.is_known_lead).length,
      top_visitors: digests.slice(0, 20), // Top 20 by intent score
      all_visitors: digests,
      generated_at: new Date().toISOString(),
    };

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(summaryPayload),
    });

    if (!res.ok) {
      console.error("Zapier daily digest webhook failed:", res.status, await res.text());
      return new Response(JSON.stringify({ success: false, error: "Webhook failed" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Daily digest sent successfully: ${digests.length} visitors`);

    return new Response(JSON.stringify({ 
      success: true, 
      visitors: digests.length,
      known_leads: digests.filter(d => d.is_known_lead).length,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in send-daily-visitor-digest:", error);
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
