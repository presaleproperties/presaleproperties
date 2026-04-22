// alert-dispatcher — central send-out for every configured alert rule.
//
// Triggered by:
//   (a) hot-lead trigger via edge call
//   (b) sync-failure on lead_sync_log insert
//   (c) daily cron for digest
//   (d) admin "send test" button
//   (e) scheduled-email-audit when status != ok            → audit_failure
//   (f) bounce-spike watcher (cron) when threshold crossed → bounce_spike
//   (g) click-anomaly watcher (cron) when drop > threshold → click_anomaly
//
// Delivery is fan-out across the channels enabled in alert_config:
//   • email   — via send-direct-email
//   • slack   — POST to slack_webhook_url with a simple text+blocks payload
//
// Each send is logged once per channel into alert_log so the admin can audit
// what went where. The function is intentionally permissive on body shape so
// new alert types can be added without regenerating clients.

import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type AlertType =
  | "hot_lead"
  | "sync_failure"
  | "daily_digest"
  | "test"
  | "audit_failure"
  | "bounce_spike"
  | "click_anomaly";

interface RequestBody {
  type: AlertType;
  lead_id?: string;
  sync_log_id?: string;
  recipient?: string;
  payload?: Record<string, unknown>;
}

interface AlertConfig {
  id: string;
  recipient_email: string;
  email_enabled: boolean;
  slack_enabled: boolean;
  slack_webhook_url: string | null;
  hot_lead_enabled: boolean;
  hot_lead_threshold: number;
  sync_failure_enabled: boolean;
  daily_digest_enabled: boolean;
  audit_failure_enabled: boolean;
  bounce_spike_enabled: boolean;
  bounce_spike_threshold: number;
  click_anomaly_enabled: boolean;
  click_anomaly_drop_pct: number;
}

function htmlToPlain(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function postSlack(webhookUrl: string, subject: string, html: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: subject,
        blocks: [
          { type: "header", text: { type: "plain_text", text: subject.slice(0, 150), emoji: true } },
          { type: "section", text: { type: "mrkdwn", text: htmlToPlain(html).slice(0, 2900) } },
        ],
      }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      return { ok: false, error: `slack ${res.status}: ${t.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("VITE_SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const body = (await req.json()) as RequestBody;
    const { data: cfgRow } = await admin.from("alert_config").select("*").maybeSingle();
    const cfg = cfgRow as AlertConfig | null;
    if (!cfg) {
      return new Response(JSON.stringify({ error: "No alert config" }), { status: 400, headers: corsHeaders });
    }

    let subject = "";
    let html = "";

    // ── Build subject + html per type ────────────────────────────────────
    if (body.type === "test") {
      subject = "✅ Notification rules test";
      html = `<p>This is a test from your Presale Properties admin. If you got this on every enabled channel, alerts are wired up correctly.</p>`;
    } else if (body.type === "hot_lead" && body.lead_id) {
      if (!cfg.hot_lead_enabled) return new Response(JSON.stringify({ skipped: "rule_disabled" }), { headers: corsHeaders });
      const { data: lead } = await admin.from("project_leads").select("*").eq("id", body.lead_id).maybeSingle();
      if (!lead || (lead.lead_score ?? 0) < cfg.hot_lead_threshold) {
        return new Response(JSON.stringify({ skipped: "below_threshold" }), { headers: corsHeaders });
      }
      subject = `🔥 Hot lead: ${lead.name || ""} (${lead.lead_score})`;
      html = `
        <h2>🔥 Hot lead just submitted</h2>
        <p><strong>${lead.name || ""}</strong> — score ${lead.lead_score}/100</p>
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
      if (!cfg.sync_failure_enabled) return new Response(JSON.stringify({ skipped: "rule_disabled" }), { headers: corsHeaders });
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
      if (!cfg.daily_digest_enabled) return new Response(JSON.stringify({ skipped: "rule_disabled" }), { headers: corsHeaders });
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const [{ count: leadCount }, { data: hot }, { count: failCount }] = await Promise.all([
        admin.from("project_leads").select("*", { count: "exact", head: true }).gte("created_at", since),
        admin.from("project_leads").select("name,email,lead_score").gte("created_at", since).eq("lead_temperature", "hot").limit(10),
        admin.from("lead_sync_log").select("*", { count: "exact", head: true }).gte("created_at", since).neq("status", "success"),
      ]);
      subject = `📊 Daily lead digest — ${leadCount ?? 0} leads`;
      html = `
        <h2>Last 24h</h2>
        <p>Leads: <strong>${leadCount ?? 0}</strong> · Hot: <strong>${hot?.length ?? 0}</strong> · Sync failures: <strong>${failCount ?? 0}</strong></p>
        <h3>Hot leads</h3>
        <ul>${(hot || []).map((h: { name?: string; email?: string; lead_score?: number }) =>
          `<li>${h.name || ""} (${h.email}) — score ${h.lead_score}</li>`).join("") || "<li>None</li>"}</ul>
      `;
    } else if (body.type === "audit_failure") {
      if (!cfg.audit_failure_enabled) return new Response(JSON.stringify({ skipped: "rule_disabled" }), { headers: corsHeaders });
      const { data: run } = await admin
        .from("email_audit_runs")
        .select("status, total_errors, total_links, projects_sampled, errors, ran_at, template_key, trigger_source")
        .order("ran_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const r = (body.payload as Record<string, unknown> | undefined) ?? run ?? {};
      const errArr = Array.isArray((r as { errors?: unknown }).errors) ? (r as { errors: unknown[] }).errors : [];
      subject = `🛡️ Email audit failed — ${(r as { total_errors?: number }).total_errors ?? 0} link issues`;
      html = `
        <h2>🛡️ Recommendation-email audit failed</h2>
        <p>Status: <strong>${(r as { status?: string }).status ?? "unknown"}</strong> ·
        Links checked: <strong>${(r as { total_links?: number }).total_links ?? 0}</strong> ·
        Projects sampled: <strong>${(r as { projects_sampled?: number }).projects_sampled ?? 0}</strong></p>
        <p>Trigger: ${(r as { trigger_source?: string }).trigger_source ?? "—"} · Template: ${(r as { template_key?: string }).template_key ?? "—"}</p>
        <h3>Top issues</h3>
        <ul>${errArr.slice(0, 5).map((e) => `<li><code>${JSON.stringify(e).slice(0, 200)}</code></li>`).join("") || "<li>(no detail)</li>"}</ul>
        <p>Open the Email Health dashboard to drill in.</p>
      `;
    } else if (body.type === "bounce_spike") {
      if (!cfg.bounce_spike_enabled) return new Response(JSON.stringify({ skipped: "rule_disabled" }), { headers: corsHeaders });
      const sinceHour = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count: bounceCount } = await admin
        .from("email_logs")
        .select("*", { count: "exact", head: true })
        .gte("sent_at", sinceHour)
        .in("status", ["bounced", "failed", "dlq"]);
      const fromPayload = (body.payload as { count?: number } | undefined)?.count;
      const count = fromPayload ?? bounceCount ?? 0;
      subject = `📭 Bounce spike — ${count} email failures in the last hour`;
      html = `
        <h2>📭 Bounce spike detected</h2>
        <p>${count} email sends bounced or failed in the last hour (threshold: ${cfg.bounce_spike_threshold}).</p>
        <p>Check the Email Center → recent sends and the Email Health dashboard for failing addresses.</p>
      `;
    } else if (body.type === "click_anomaly") {
      if (!cfg.click_anomaly_enabled) return new Response(JSON.stringify({ skipped: "rule_disabled" }), { headers: corsHeaders });
      const dropPct = (body.payload as { drop_pct?: number } | undefined)?.drop_pct ?? cfg.click_anomaly_drop_pct;
      const window = (body.payload as { window?: string } | undefined)?.window ?? "last 24h vs prior 24h";
      subject = `📉 Click-through anomaly — down ${dropPct}%`;
      html = `
        <h2>📉 Click-through anomaly</h2>
        <p>Email click-through is down <strong>${dropPct}%</strong> (${window}, threshold: ${cfg.click_anomaly_drop_pct}%).</p>
        <p>Investigate recent sends, audit recommendation links, and check tracking-pixel health.</p>
      `;
    } else {
      return new Response(JSON.stringify({ error: "Unknown type" }), { status: 400, headers: corsHeaders });
    }

    // ── Fan-out to enabled channels ──────────────────────────────────────
    const recipient = body.recipient || cfg.recipient_email;
    const results: Array<{ channel: string; ok: boolean; error?: string }> = [];

    if (cfg.email_enabled && recipient) {
      try {
        const tx = await admin.functions.invoke("send-direct-email", { body: { to: recipient, subject, html } });
        results.push({ channel: "email", ok: !tx.error, error: tx.error?.message });
      } catch (e) {
        results.push({ channel: "email", ok: false, error: String(e) });
      }
    }

    if (cfg.slack_enabled && cfg.slack_webhook_url) {
      const r = await postSlack(cfg.slack_webhook_url, subject, html);
      results.push({ channel: "slack", ok: r.ok, error: r.error });
    }

    for (const r of results) {
      await admin.from("alert_log").insert({
        alert_type: body.type,
        recipient_email: r.channel === "email" ? recipient : `slack:${(cfg.slack_webhook_url ?? "").slice(-12)}`,
        subject,
        payload: { ...body, channel: r.channel } as unknown as Record<string, unknown>,
        status: r.ok ? "sent" : "failed",
        error_message: r.error || null,
        related_id: body.lead_id || body.sync_log_id || null,
      });
    }

    if (results.length === 0) {
      return new Response(JSON.stringify({ skipped: "no_channels_enabled" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(
      JSON.stringify({ ok: results.every((r) => r.ok), results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("alert-dispatcher error", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
