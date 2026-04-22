// email-campaign-health-report
// ─────────────────────────────────────────────────────────────────────────────
// Daily anomaly report for sent email campaigns.
//
// For each campaign sent in the last 24h (grouped by `template_type` +
// `subject` + `sent_by`), it computes:
//   • sent count
//   • unique opens / opens
//   • unique clicks / total clicks  → click-through rate (CTR)
//   • redirect-to-empty rate from email_link_clicks (rows where the
//     track-email-open redirect was hit but `destination_url` was NULL/empty
//     — indicates broken/malformed links in the email HTML)
//
// Flags any campaign that:
//   1. Sent ≥ MIN_SENT_FOR_FLAG (default 10) AND received 0 clicks, OR
//   2. Has redirect-to-empty rate ≥ EMPTY_REDIRECT_THRESHOLD (default 5%)
//
// If anything is flagged, a digest email is sent to alert_config.recipient_email.
// Always returns a JSON summary (so it can be inspected from cron logs / curl).
//
// Triggered by pg_cron daily at 13:00 UTC (≈ 6 AM PT).

import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MIN_SENT_FOR_FLAG = 10;
const EMPTY_REDIRECT_THRESHOLD = 0.05; // 5%

interface EmailLogRow {
  id: string;
  template_type: string | null;
  subject: string | null;
  sent_by: string | null;
  sent_at: string;
  open_count: number | null;
  opened_at: string | null;
  click_count: number | null;
  clicked_at: string | null;
  status: string;
}

interface ClickRow {
  email_log_id: string | null;
  destination_url: string | null;
}

interface CampaignStats {
  key: string;
  template_type: string;
  subject: string;
  sent: number;
  delivered: number;
  unique_opens: number;
  total_opens: number;
  unique_clicks: number;
  total_clicks: number;
  ctr: number; // unique_clicks / delivered
  click_events: number;
  empty_redirects: number;
  empty_redirect_rate: number;
  flags: string[];
}

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    // Allow caller to override the window (default 24h)
    let lookbackHours = 24;
    let dryRun = false;
    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (typeof body?.lookback_hours === "number") lookbackHours = body.lookback_hours;
        if (body?.dry_run === true) dryRun = true;
      } catch { /* no body — use defaults */ }
    } else {
      const u = new URL(req.url);
      if (u.searchParams.get("dry_run") === "1") dryRun = true;
      const lh = u.searchParams.get("lookback_hours");
      if (lh) lookbackHours = Number(lh);
    }
    const since = new Date(Date.now() - lookbackHours * 60 * 60 * 1000).toISOString();

    // 1) Pull every send from the window
    const { data: logs, error: logsErr } = await admin
      .from("email_logs")
      .select(
        "id,template_type,subject,sent_by,sent_at,open_count,opened_at,click_count,clicked_at,status",
      )
      .gte("sent_at", since)
      .order("sent_at", { ascending: false })
      .limit(5000);
    if (logsErr) throw logsErr;
    const rows = (logs ?? []) as EmailLogRow[];

    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, window_hours: lookbackHours, sent: 0, message: "No sends in window" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2) Pull all click events in the same window
    const logIds = rows.map((r) => r.id);
    const { data: clicks, error: clicksErr } = await admin
      .from("email_link_clicks")
      .select("email_log_id,destination_url")
      .in("email_log_id", logIds)
      .gte("clicked_at", since);
    if (clicksErr) throw clicksErr;
    const clickRows = (clicks ?? []) as ClickRow[];

    const clicksByLog = new Map<string, ClickRow[]>();
    for (const c of clickRows) {
      if (!c.email_log_id) continue;
      const arr = clicksByLog.get(c.email_log_id) ?? [];
      arr.push(c);
      clicksByLog.set(c.email_log_id, arr);
    }

    // 3) Group by campaign (template_type + subject — campaign_id is mostly null
    //    on this project, so subject is the most reliable grouping key)
    const groups = new Map<string, EmailLogRow[]>();
    for (const r of rows) {
      const key = `${r.template_type ?? "unknown"}::${r.subject ?? "(no subject)"}`;
      const arr = groups.get(key) ?? [];
      arr.push(r);
      groups.set(key, arr);
    }

    const campaigns: CampaignStats[] = [];
    for (const [key, group] of groups) {
      const [template_type, subject] = key.split("::");
      const sent = group.length;
      const delivered = group.filter((r) => r.status === "sent" || !r.status).length || sent;
      const unique_opens = group.filter((r) => !!r.opened_at).length;
      const total_opens = group.reduce((a, r) => a + (r.open_count ?? 0), 0);
      const unique_clicks = group.filter((r) => !!r.clicked_at).length;
      const total_clicks = group.reduce((a, r) => a + (r.click_count ?? 0), 0);

      let click_events = 0;
      let empty_redirects = 0;
      for (const r of group) {
        const cs = clicksByLog.get(r.id) ?? [];
        click_events += cs.length;
        for (const c of cs) {
          if (!c.destination_url || c.destination_url.trim() === "") empty_redirects += 1;
        }
      }
      const empty_redirect_rate = click_events > 0 ? empty_redirects / click_events : 0;
      const ctr = delivered > 0 ? unique_clicks / delivered : 0;

      const flags: string[] = [];
      if (sent >= MIN_SENT_FOR_FLAG && unique_clicks === 0) flags.push("zero_clicks");
      if (click_events >= 5 && empty_redirect_rate >= EMPTY_REDIRECT_THRESHOLD) {
        flags.push("high_empty_redirects");
      }

      campaigns.push({
        key,
        template_type,
        subject,
        sent,
        delivered,
        unique_opens,
        total_opens,
        unique_clicks,
        total_clicks,
        ctr,
        click_events,
        empty_redirects,
        empty_redirect_rate,
        flags,
      });
    }

    campaigns.sort((a, b) => b.sent - a.sent);
    const flagged = campaigns.filter((c) => c.flags.length > 0);

    // Totals
    const totals = {
      campaigns: campaigns.length,
      sent: campaigns.reduce((a, c) => a + c.sent, 0),
      unique_clicks: campaigns.reduce((a, c) => a + c.unique_clicks, 0),
      click_events: campaigns.reduce((a, c) => a + c.click_events, 0),
      empty_redirects: campaigns.reduce((a, c) => a + c.empty_redirects, 0),
      flagged: flagged.length,
    };

    // 4) Build report email if anything is flagged
    let emailSent = false;
    let recipient: string | null = null;

    if (flagged.length > 0 && !dryRun) {
      const { data: cfg } = await admin
        .from("alert_config")
        .select("recipient_email")
        .maybeSingle();
      recipient = cfg?.recipient_email ?? null;

      if (recipient) {
        const subject = `⚠️ Email campaign health — ${flagged.length} flagged (${totals.sent} sent)`;
        const html = renderReportHtml({
          windowHours: lookbackHours,
          totals,
          flagged,
          allCampaigns: campaigns.slice(0, 20),
        });

        try {
          const tx = await admin.functions.invoke("send-direct-email", {
            body: { to: recipient, subject, html },
          });
          emailSent = !tx.error;

          await admin.from("alert_log").insert({
            alert_type: "email_campaign_health_report",
            recipient_email: recipient,
            subject,
            status: emailSent ? "sent" : "failed",
            error_message: tx.error?.message ?? null,
            payload: { totals, flagged_keys: flagged.map((f) => f.key) } as unknown as Record<string, unknown>,
          });
        } catch (e) {
          console.error("send-direct-email failed", e);
          await admin.from("alert_log").insert({
            alert_type: "email_campaign_health_report",
            recipient_email: recipient,
            subject,
            status: "failed",
            error_message: String(e),
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        window_hours: lookbackHours,
        dry_run: dryRun,
        totals,
        flagged: flagged.map((f) => ({
          template_type: f.template_type,
          subject: f.subject,
          sent: f.sent,
          unique_clicks: f.unique_clicks,
          ctr: f.ctr,
          empty_redirects: f.empty_redirects,
          empty_redirect_rate: f.empty_redirect_rate,
          flags: f.flags,
        })),
        email_sent: emailSent,
        recipient: emailSent ? recipient : null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("email-campaign-health-report error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function renderReportHtml(opts: {
  windowHours: number;
  totals: { campaigns: number; sent: number; unique_clicks: number; click_events: number; empty_redirects: number; flagged: number };
  flagged: CampaignStats[];
  allCampaigns: CampaignStats[];
}): string {
  const { windowHours, totals, flagged, allCampaigns } = opts;
  const flagBadge = (f: string) =>
    f === "zero_clicks"
      ? '<span style="background:#fee2e2;color:#991b1b;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;">0 CLICKS</span>'
      : '<span style="background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;">EMPTY REDIRECTS</span>';

  const flaggedRows = flagged
    .map(
      (c) => `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #eee;font-size:13px;">
          <div style="font-weight:600;color:#111;">${escapeHtml(c.subject)}</div>
          <div style="color:#888;font-size:11px;margin-top:2px;">${escapeHtml(c.template_type)}</div>
          <div style="margin-top:6px;">${c.flags.map(flagBadge).join(" ")}</div>
        </td>
        <td align="right" style="padding:10px;border-bottom:1px solid #eee;font-size:13px;color:#111;">${c.sent}</td>
        <td align="right" style="padding:10px;border-bottom:1px solid #eee;font-size:13px;color:${c.unique_clicks === 0 ? "#dc2626" : "#111"};font-weight:${c.unique_clicks === 0 ? 700 : 400};">${c.unique_clicks}</td>
        <td align="right" style="padding:10px;border-bottom:1px solid #eee;font-size:13px;color:#111;">${pct(c.ctr)}</td>
        <td align="right" style="padding:10px;border-bottom:1px solid #eee;font-size:13px;color:${c.empty_redirects > 0 ? "#dc2626" : "#888"};">${c.empty_redirects}/${c.click_events} (${pct(c.empty_redirect_rate)})</td>
      </tr>`,
    )
    .join("");

  const allRows = allCampaigns
    .map(
      (c) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #f3f3f3;font-size:12px;color:#444;">${escapeHtml(c.subject.slice(0, 60))}${c.subject.length > 60 ? "…" : ""}</td>
        <td align="right" style="padding:8px;border-bottom:1px solid #f3f3f3;font-size:12px;color:#444;">${c.sent}</td>
        <td align="right" style="padding:8px;border-bottom:1px solid #f3f3f3;font-size:12px;color:#444;">${c.unique_opens}</td>
        <td align="right" style="padding:8px;border-bottom:1px solid #f3f3f3;font-size:12px;color:#444;">${c.unique_clicks}</td>
        <td align="right" style="padding:8px;border-bottom:1px solid #f3f3f3;font-size:12px;color:#444;">${pct(c.ctr)}</td>
      </tr>`,
    )
    .join("");

  return `
<!DOCTYPE html><html><body style="margin:0;padding:24px;background:#f7f5f2;font-family:'Helvetica Neue',Arial,sans-serif;color:#111;">
<table width="640" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #e8e2d6;border-radius:12px;margin:0 auto;max-width:100%;">
  <tr><td style="padding:24px 28px 12px;border-bottom:2px solid #C9A55A;">
    <h1 style="margin:0;font-size:20px;font-weight:700;">⚠️ Email Campaign Health Report</h1>
    <p style="margin:6px 0 0;font-size:13px;color:#666;">Last ${windowHours}h · ${totals.sent} sent across ${totals.campaigns} campaigns · <strong style="color:#dc2626;">${totals.flagged} flagged</strong></p>
  </td></tr>

  <tr><td style="padding:18px 28px 8px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        ${[
          ["Sent", totals.sent.toString()],
          ["Unique clicks", totals.unique_clicks.toString()],
          ["Click events", totals.click_events.toString()],
          ["Empty redirects", `${totals.empty_redirects}`],
        ]
          .map(
            ([label, value]) => `
          <td width="25%" style="padding:8px;background:#faf8f4;border-radius:8px;text-align:center;">
            <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">${label}</div>
            <div style="font-size:20px;font-weight:700;margin-top:4px;">${value}</div>
          </td>`,
          )
          .join("<td style='width:8px;'></td>")}
      </tr>
    </table>
  </td></tr>

  ${
    flagged.length > 0
      ? `
  <tr><td style="padding:20px 28px 8px;">
    <h2 style="margin:0 0 10px;font-size:14px;text-transform:uppercase;letter-spacing:1.5px;color:#dc2626;">Flagged campaigns</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #fecaca;border-radius:8px;overflow:hidden;">
      <thead>
        <tr style="background:#fef2f2;">
          <th align="left" style="padding:8px 10px;font-size:11px;color:#991b1b;text-transform:uppercase;letter-spacing:1px;">Campaign</th>
          <th align="right" style="padding:8px 10px;font-size:11px;color:#991b1b;text-transform:uppercase;letter-spacing:1px;">Sent</th>
          <th align="right" style="padding:8px 10px;font-size:11px;color:#991b1b;text-transform:uppercase;letter-spacing:1px;">Clicks</th>
          <th align="right" style="padding:8px 10px;font-size:11px;color:#991b1b;text-transform:uppercase;letter-spacing:1px;">CTR</th>
          <th align="right" style="padding:8px 10px;font-size:11px;color:#991b1b;text-transform:uppercase;letter-spacing:1px;">Empty redirects</th>
        </tr>
      </thead>
      <tbody>${flaggedRows}</tbody>
    </table>
    <p style="margin:10px 0 0;font-size:11px;color:#888;line-height:1.6;">
      <strong>0 CLICKS</strong>: campaign sent ≥${MIN_SENT_FOR_FLAG} but no recipient clicked any link.<br/>
      <strong>EMPTY REDIRECTS</strong>: ≥${pct(EMPTY_REDIRECT_THRESHOLD)} of clicks hit the tracking endpoint with no destination URL — usually a broken merge tag or missing href in the template.
    </p>
  </td></tr>`
      : ""
  }

  <tr><td style="padding:20px 28px;">
    <h2 style="margin:0 0 10px;font-size:14px;text-transform:uppercase;letter-spacing:1.5px;color:#666;">All campaigns</h2>
    <table width="100%" cellpadding="0" cellspacing="0">
      <thead>
        <tr style="border-bottom:2px solid #eee;">
          <th align="left" style="padding:8px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">Subject</th>
          <th align="right" style="padding:8px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">Sent</th>
          <th align="right" style="padding:8px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">Opens</th>
          <th align="right" style="padding:8px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">Clicks</th>
          <th align="right" style="padding:8px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">CTR</th>
        </tr>
      </thead>
      <tbody>${allRows || '<tr><td colspan="5" style="padding:12px;text-align:center;color:#888;font-size:12px;">No data</td></tr>'}</tbody>
    </table>
  </td></tr>

  <tr><td style="padding:14px 28px 24px;border-top:1px solid #f0ede8;">
    <p style="margin:0;font-size:11px;color:#aaa;">Automated report · Presale Properties · Generated ${new Date().toUTCString()}</p>
  </td></tr>
</table>
</body></html>`;
}
