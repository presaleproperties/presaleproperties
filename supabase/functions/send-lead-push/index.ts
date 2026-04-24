/**
 * send-lead-push
 * Sends a Web Push notification to all admin subscriptions for a pending lead,
 * including signed approve/reject URLs that hit the approve-lead-link endpoint.
 *
 * POST { leadId }
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
// @ts-ignore -- npm package resolved at runtime by edge runtime
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function b64urlEncode(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
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
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function makeSignedToken(
  leadId: string,
  action: "approve" | "reject",
  serviceKey: string,
): Promise<string> {
  const payload = {
    leadId,
    action,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
  };
  const json = new TextEncoder().encode(JSON.stringify(payload));
  const payloadB64 = b64urlEncode(json);
  const sig = await hmacSha256Hex(serviceKey, payloadB64);
  return `${payloadB64}.${sig}`;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { leadId } = await req.json();
    if (!leadId) {
      return new Response(JSON.stringify({ error: "missing leadId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY")!;
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:info@presaleproperties.com";

    if (!vapidPublic || !vapidPrivate) {
      return new Response(
        JSON.stringify({ error: "VAPID keys not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: lead } = await admin
      .from("project_leads")
      .select("id, name, email, realtor_risk_score")
      .eq("id", leadId)
      .maybeSingle();
    if (!lead) {
      return new Response(JSON.stringify({ error: "lead not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: subs } = await admin.from("push_subscriptions").select("*");
    if (!subs || subs.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, sent: 0, message: "no subscribers" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const approveToken = await makeSignedToken(leadId, "approve", serviceKey);
    const rejectToken = await makeSignedToken(leadId, "reject", serviceKey);
    const approveUrl = `${supabaseUrl}/functions/v1/approve-lead-link?token=${approveToken}`;
    const rejectUrl = `${supabaseUrl}/functions/v1/approve-lead-link?token=${rejectToken}`;

    const riskTag =
      lead.realtor_risk_score >= 60
        ? "🚩 HIGH risk"
        : lead.realtor_risk_score >= 30
        ? "⚠️ Medium risk"
        : "✅ Low risk";

    const payload = JSON.stringify({
      title: `New lead: ${lead.name ?? "Anonymous"}`,
      body: `${lead.email ?? ""} · ${riskTag} (${lead.realtor_risk_score}/100)`,
      tag: `lead-${leadId}`,
      leadId,
      approveUrl,
      rejectUrl,
      reviewUrl: "https://presaleproperties.com/admin/leads",
    });

    let sent = 0;
    let removed = 0;
    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: s.endpoint,
              keys: { p256dh: s.p256dh, auth: s.auth },
            },
            payload,
          );
          sent++;
        } catch (err: any) {
          const status = err?.statusCode;
          if (status === 404 || status === 410) {
            await admin.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
            removed++;
          } else {
            console.error("[send-lead-push] send error:", status, err?.body);
          }
        }
      }),
    );

    return new Response(
      JSON.stringify({ ok: true, sent, removed, total: subs.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[send-lead-push] fatal:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
