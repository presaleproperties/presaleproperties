// One-time bulk push of all project_leads to DealsFlow CRM
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const bridgeSecret = Deno.env.get("BRIDGE_SECRET");
    const crmUrl = Deno.env.get("DEALSFLOW_WEBHOOK_URL") ||
      "https://svbilqvudkkdhslxebce.supabase.co/functions/v1/receive-presale-activity";

    if (!bridgeSecret) {
      return new Response(JSON.stringify({ error: "BRIDGE_SECRET not set" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sb = createClient(supabaseUrl, serviceKey);

    // Fetch all leads
    const { data: leads, error } = await sb
      .from("project_leads")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) throw error;

    const results: Array<{ email: string; status: number | string; event: string }> = [];

    for (const lead of leads ?? []) {
      const email = lead.email?.trim().toLowerCase();
      const phone = lead.phone?.trim();

      if (!email && !phone) {
        results.push({ email: lead.email ?? "none", status: "skipped_no_id", event: "lead.sync" });
        continue;
      }

      // Push lead creation event
      const payload = {
        type: "lead.created",
        lead_email: email,
        lead_phone: phone,
        metadata: {
          source: "presale_properties_bulk_sync",
          lead_id: lead.id,
          name: lead.name,
          lead_source: lead.lead_source,
          lead_type: lead.lead_type,
          approval_status: lead.approval_status,
          persona: lead.persona,
          agent_status: lead.agent_status,
          project_id: lead.project_id,
          project_name: lead.project_name,
          message: lead.message,
          utm_source: lead.utm_source,
          utm_medium: lead.utm_medium,
          utm_campaign: lead.utm_campaign,
          utm_content: lead.utm_content,
          landing_page: lead.landing_page,
          referrer: lead.referrer,
          visitor_id: lead.visitor_id,
          realtor_risk_score: lead.realtor_risk_score,
          first_name: lead.name?.split(" ")[0],
          last_name: lead.name?.split(" ").slice(1).join(" ") || undefined,
        },
        occurred_at: lead.created_at,
      };

      try {
        const resp = await fetch(crmUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-bridge-secret": bridgeSecret,
          },
          body: JSON.stringify(payload),
        });
        results.push({ email: email ?? phone ?? "?", status: resp.status, event: "lead.created" });
      } catch (e) {
        results.push({ email: email ?? "?", status: String(e), event: "lead.created" });
      }

      // If approved, also push approval event
      if (lead.approval_status === "approved") {
        try {
          const approvalPayload = {
            type: "lead.approved",
            lead_email: email,
            lead_phone: phone,
            metadata: {
              source: "presale_properties_bulk_sync",
              lead_id: lead.id,
              name: lead.name,
            },
            occurred_at: lead.approved_at ?? lead.updated_at ?? lead.created_at,
          };
          const resp2 = await fetch(crmUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-bridge-secret": bridgeSecret,
            },
            body: JSON.stringify(approvalPayload),
          });
          results.push({ email: email ?? "?", status: resp2.status, event: "lead.approved" });
        } catch (e) {
          results.push({ email: email ?? "?", status: String(e), event: "lead.approved" });
        }
      }
    }

    const summary = {
      total_leads: leads?.length ?? 0,
      events_pushed: results.length,
      successes: results.filter(r => r.status === 200).length,
      failures: results.filter(r => r.status !== 200 && r.status !== "skipped_no_id").length,
      skipped: results.filter(r => r.status === "skipped_no_id").length,
      details: results,
    };

    return new Response(JSON.stringify(summary, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
