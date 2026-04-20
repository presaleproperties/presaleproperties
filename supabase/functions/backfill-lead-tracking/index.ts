// backfill-lead-tracking — one-shot maintenance task.
// Fills missing first_touch_utm_* columns on historical project_leads
// by mining attribution_touches by visitor_id, and re-runs lead score v2.

import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("VITE_SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  // Pull leads missing first-touch attribution
  const { data: leads, error } = await admin
    .from("project_leads")
    .select("id, visitor_id, utm_source, utm_medium, utm_campaign, first_touch_utm_source, created_at")
    .is("first_touch_utm_source", null)
    .not("visitor_id", "is", null)
    .limit(500);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });

  let updated = 0;
  let scored = 0;

  for (const lead of leads || []) {
    // Find earliest touch for this visitor
    const { data: touches } = await admin
      .from("attribution_touches")
      .select("utm_source, utm_medium, utm_campaign, touch_at")
      .eq("visitor_id", lead.visitor_id!)
      .order("touch_at", { ascending: true })
      .limit(1);

    const firstTouch = touches?.[0];

    const patch: Record<string, unknown> = {};
    if (firstTouch) {
      patch.first_touch_utm_source = firstTouch.utm_source || lead.utm_source;
      patch.first_touch_utm_medium = firstTouch.utm_medium || lead.utm_medium;
      patch.first_touch_utm_campaign = firstTouch.utm_campaign || lead.utm_campaign;
      patch.first_touch_at = firstTouch.touch_at;
    } else if (lead.utm_source) {
      // Use last-touch as best-known first-touch
      patch.first_touch_utm_source = lead.utm_source;
      patch.first_touch_utm_medium = lead.utm_medium;
      patch.first_touch_utm_campaign = lead.utm_campaign;
      patch.first_touch_at = lead.created_at;
    }

    if (Object.keys(patch).length > 0) {
      await admin.from("project_leads").update(patch).eq("id", lead.id);
      updated++;
    }

    // Recompute lead score v2
    const { data: scoreData } = await admin.rpc("calculate_lead_score_v2", { p_lead_id: lead.id });
    if (typeof scoreData === "number") {
      const temperature = scoreData >= 70 ? "hot" : scoreData >= 40 ? "warm" : "cold";
      await admin.from("project_leads").update({ lead_score: scoreData, lead_temperature: temperature }).eq("id", lead.id);
      scored++;
    }
  }

  return new Response(JSON.stringify({ ok: true, examined: leads?.length ?? 0, updated, scored }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
