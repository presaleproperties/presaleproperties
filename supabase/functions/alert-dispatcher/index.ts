// alert-dispatcher — sends configured email alerts.
// Triggered by: (a) hot-lead trigger via edge call, (b) sync-failure on lead_sync_log insert,
// (c) daily cron for digest, (d) admin "send test" button.
//
// All sends go through send-transactional-email if available, falling back to a
// simple direct send via SUPABASE_URL → resend handler used by the project.

import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  type: "hot_lead" | "sync_failure" | "daily_digest" | "test";
  lead_id?: string;
  sync_log_id?: string;
  recipient?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("VITE_SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const body = (await req.json()) as RequestBody;
    const { data: cfg } = await admin.from("alert_config").select("*").maybeSingle();
    if (!cfg) {
      return new Response(JSON.stringify({ error: "No alert config" }), { status: 400, headers: corsHeaders });
    }

    const recipient = body.recipient || cfg.recipient_email;
    let subject = "";
    let html = "";

    if (body.type === "test") {
      subject = "✅ Alert system test";
      html = `<p>This is a test alert from your Presale Properties admin. If you got this, alerts are wired up correctly.</p>`;
    } else if (body.type === "hot_lead" && body.lead_id) {
      if (!cfg.hot_lead_enabled) return new Response(JSON.stringify({ skipped: "disabled" }), { headers: corsHeaders });
      const { data: lead } = await admin.from("project_leads").select("*").eq("id", body.lead_id).maybeSingle();
      if (!lead || (lead.lead_score ?? 0) < cfg.hot_lead_threshold) {
        return new Response(JSON.stringify({ skipped: "below_threshold" }), { headers: corsHeaders });
      }
      subject = `🔥 Hot lead: ${lead.first_name || ""} ${lead.last_name || ""} (${lead.lead_score})`;
      html = `
        <h2>🔥 Hot lead just submitted</h2>
        <p><strong>${lead.first_name || ""} ${lead.last_name || ""}</strong> — score ${lead.lead_score}/${100}</p>
        <ul>
          <li>Email: ${lead.email}</li>
          <li>Phone: ${lead.phone || "—"}</li>
          <li>Project: ${lead.project_name || "—"}</li>
          <li>Form: ${lead.form_type || "—"}</li>
          <li>UTM source: ${lead.utm_source || "(direct)"}</li>
        </ul>
        <p><strong>Respond within 5 minutes for best close rate.</strong></p>
      `;
    } else if (body.type === "sync_failure" && body.sync_log_id) {
      if (!cfg.sync_failure_enabled) return new Response(JSON.stringify({ skipped: "disabled" }), { headers: corsHeaders });
      const { data: log } = await admin.from("lead_sync_log").select("*").eq("id", body.sync_log_id).maybeSingle();
      if (!log || log.status === "success") return new Response(JSON.stringify({ skipped: "success" }), { headers: corsHeaders });
      subject = `⚠️ Lead sync failed → ${log.destination}`;
      html = `
        <h2>⚠️ Lead sync failure</h2>
        <p>Destination: <strong>${log.destination}</strong> · Status code: ${log.status_code ?? "—"}</p>
        <p><code>${log.error_message || "no message"}</code></p>
        <p>Lead ID: ${log.lead_id || "—"}</p>
      `;
    } else if (body.type === "daily_digest") {
      if (!cfg.daily_digest_enabled) return new Response(JSON.stringify({ skipped: "disabled" }), { headers: corsHeaders });
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const [{ count: leadCount }, { data: hot }, { count: failCount }] = await Promise.all([
        admin.from("project_leads").select("*", { count: "exact", head: true }).gte("created_at", since),
        admin.from("project_leads").select("first_name,email,lead_score").gte("created_at", since).eq("lead_temperature", "hot").limit(10),
        admin.from("lead_sync_log").select("*", { count: "exact", head: true }).gte("created_at", since).neq("status", "success"),
      ]);
      subject = `📊 Daily lead digest — ${leadCount ?? 0} leads`;
      html = `
        <h2>Last 24h</h2>
        <p>Leads: <strong>${leadCount ?? 0}</strong> · Hot: <strong>${hot?.length ?? 0}</strong> · Sync failures: <strong>${failCount ?? 0}</strong></p>
        <h3>Hot leads</h3>
        <ul>${(hot || []).map((h) => `<li>${h.first_name || ""} (${h.email}) — score ${h.lead_score}</li>`).join("") || "<li>None</li>"}</ul>
      `;
    } else {
      return new Response(JSON.stringify({ error: "Unknown type" }), { status: 400, headers: corsHeaders });
    }

    // Try send-transactional-email first; fall back to send-direct-email if not deployed
    let sendResult: { ok: boolean; error?: string } = { ok: false };
    try {
      const tx = await admin.functions.invoke("send-direct-email", {
        body: { to: recipient, subject, html },
      });
      sendResult = { ok: !tx.error, error: tx.error?.message };
    } catch (e) {
      sendResult = { ok: false, error: String(e) };
    }

    await admin.from("alert_log").insert({
      alert_type: body.type,
      recipient_email: recipient,
      subject,
      payload: body as unknown as Record<string, unknown>,
      status: sendResult.ok ? "sent" : "failed",
      error_message: sendResult.error || null,
      related_id: body.lead_id || body.sync_log_id || null,
    });

    return new Response(JSON.stringify({ ok: sendResult.ok }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("alert-dispatcher error", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
