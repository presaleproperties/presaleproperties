/**
 * send-lead-approval-email
 * ─────────────────────────────────────────────────────────────
 * Processes pending `lead_approval_pending` rows from notifications_queue and
 * sends the admin an email with one-click Approve / Reject buttons (HMAC-signed
 * links handled by the `approve-lead-link` edge function).
 *
 * Trigger: cron (every 1-2 min) or manual POST. No body required.
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function b64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmacSha256Hex(key: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(data));
  return bytesToHex(new Uint8Array(sig));
}

async function makeToken(
  leadId: string,
  action: "approve" | "reject",
  signingKey: string,
  ttlHours = 72,
): Promise<string> {
  const payload = {
    leadId,
    action,
    exp: Math.floor(Date.now() / 1000) + ttlHours * 3600,
  };
  const payloadB64 = b64urlEncode(
    new TextEncoder().encode(JSON.stringify(payload)),
  );
  const sig = await hmacSha256Hex(signingKey, payloadB64);
  return `${payloadB64}.${sig}`;
}

function riskColor(score: number) {
  if (score >= 60) return { bg: "#fef2f2", text: "#991b1b", label: "🚩 HIGH realtor risk" };
  if (score >= 30) return { bg: "#fef3c7", text: "#92400e", label: "⚠️ Medium risk" };
  return { bg: "#f0fdf4", text: "#166534", label: "✅ Low risk" };
}

function buildEmail(opts: {
  lead: any;
  approveUrl: string;
  rejectUrl: string;
  dashboardUrl: string;
}): string {
  const { lead, approveUrl, rejectUrl, dashboardUrl } = opts;
  const risk = riskColor(lead.realtor_risk_score ?? 0);
  const signals = Array.isArray(lead.realtor_risk_signals)
    ? lead.realtor_risk_signals
        .map(
          (s: any) =>
            `<li style="margin:4px 0;color:#475569;font-size:13px">
              <strong>${(s.type ?? "").replace(/_/g, " ")}</strong>: ${s.detail ?? ""}
            </li>`,
        )
        .join("")
    : "";

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:14px;box-shadow:0 4px 20px rgba(0,0,0,.06);overflow:hidden">
        <tr><td style="padding:28px 32px 8px">
          <div style="display:inline-block;background:${risk.bg};color:${risk.text};padding:6px 12px;border-radius:999px;font-size:12px;font-weight:600;margin-bottom:12px">
            ${risk.label} · Score ${lead.realtor_risk_score ?? 0}/100
          </div>
          <h1 style="margin:0;font-size:20px;color:#0f172a">New lead awaiting approval</h1>
        </td></tr>
        <tr><td style="padding:0 32px 8px">
          <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#334155;line-height:1.6">
            <tr><td style="padding:6px 0;width:90px;color:#64748b">Name</td><td style="font-weight:500">${lead.name ?? "—"}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b">Email</td><td><a href="mailto:${lead.email}" style="color:#0ea5e9;text-decoration:none">${lead.email ?? "—"}</a></td></tr>
            <tr><td style="padding:6px 0;color:#64748b">Phone</td><td>${lead.phone ?? "—"}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b">Source</td><td>${lead.lead_source ?? "—"}</td></tr>
            ${lead.message ? `<tr><td style="padding:6px 0;color:#64748b;vertical-align:top">Message</td><td style="font-style:italic;color:#475569">"${lead.message}"</td></tr>` : ""}
          </table>
        </td></tr>
        ${signals ? `<tr><td style="padding:8px 32px"><div style="background:#f8fafc;border-radius:10px;padding:12px 16px"><div style="font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Risk signals</div><ul style="margin:0;padding-left:18px">${signals}</ul></div></td></tr>` : ""}
        <tr><td style="padding:24px 32px 8px" align="center">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="padding-right:8px">
              <a href="${approveUrl}" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;font-size:15px">✓ Approve & send email</a>
            </td>
            <td>
              <a href="${rejectUrl}" style="display:inline-block;background:#fff;color:#dc2626;text-decoration:none;padding:13px 26px;border-radius:10px;font-weight:600;font-size:15px;border:2px solid #fecaca">✕ Reject</a>
            </td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:8px 32px 28px" align="center">
          <p style="font-size:12px;color:#94a3b8;margin:8px 0 0">
            One-click links expire in 72 hours. <a href="${dashboardUrl}" style="color:#64748b">Open admin dashboard</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) throw new Error("RESEND_API_KEY not configured");

    const supabase = createClient(supabaseUrl, serviceKey);

    // Get pending notifications
    const { data: pending, error: fetchErr } = await supabase
      .from("notifications_queue")
      .select("*")
      .eq("notification_type", "lead_approval_pending")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(20);

    if (fetchErr) throw fetchErr;
    if (!pending || pending.length === 0) {
      return new Response(
        JSON.stringify({ success: true, processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let sent = 0;
    let failed = 0;

    for (const notif of pending) {
      try {
        const meta = (notif.metadata ?? {}) as any;
        const leadId = meta.lead_id;
        if (!leadId) {
          await supabase
            .from("notifications_queue")
            .update({ status: "failed" })
            .eq("id", notif.id);
          failed++;
          continue;
        }

        // Refetch full lead row for richest payload
        const { data: lead } = await supabase
          .from("project_leads")
          .select(
            "id, name, email, phone, message, lead_source, realtor_risk_score, realtor_risk_signals, approval_status",
          )
          .eq("id", leadId)
          .maybeSingle();

        if (!lead || lead.approval_status !== "pending") {
          // Already actioned — mark notification done
          await supabase
            .from("notifications_queue")
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .eq("id", notif.id);
          continue;
        }

        const approveTok = await makeToken(leadId, "approve", serviceKey);
        const rejectTok = await makeToken(leadId, "reject", serviceKey);
        const base = `${supabaseUrl}/functions/v1/approve-lead-link`;
        const approveUrl = `${base}?token=${approveTok}`;
        const rejectUrl = `${base}?token=${rejectTok}`;
        const dashboardUrl = "https://presaleproperties.com/admin/leads";

        const html = buildEmail({ lead, approveUrl, rejectUrl, dashboardUrl });

        const resp = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Presale Properties <alerts@presaleproperties.com>",
            to: [notif.recipient_email],
            subject: notif.subject ?? `New lead awaiting approval — ${lead.name ?? lead.email}`,
            html,
          }),
        });

        if (resp.ok) {
          await supabase
            .from("notifications_queue")
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .eq("id", notif.id);
          sent++;

          // Fire-and-forget web push to admin devices
          try {
            const leadId = (notif.metadata as any)?.lead_id;
            if (leadId) {
              fetch(`${supabaseUrl}/functions/v1/send-lead-push`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${serviceKey}`,
                },
                body: JSON.stringify({ leadId }),
              }).catch((e) => console.error("[push] fire failed:", e));
            }
          } catch (e) {
            console.error("[push] dispatch error:", e);
          }
        } else {
          const body = await resp.text();
          console.error("[send-lead-approval-email] Resend failed:", body);
          await supabase
            .from("notifications_queue")
            .update({ status: "failed" })
            .eq("id", notif.id);
          failed++;
        }
      } catch (err) {
        console.error("[send-lead-approval-email] notif error:", err);
        await supabase
          .from("notifications_queue")
          .update({ status: "failed" })
          .eq("id", notif.id);
        failed++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: pending.length, sent, failed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[send-lead-approval-email] error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
