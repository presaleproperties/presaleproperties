// Real-time "lead is back on the website" notifier.
// Triggered from the browser by BehaviorTracker the moment a known lead
// (email previously captured in any form) re-opens the site. No 30-min gap.
//
// Sends two parallel notifications:
//   1. Twilio SMS to the admin number(s) listed below.
//   2. Web Push (VAPID) to every push subscription belonging to an admin user.
//
// Idempotency: BehaviorTracker only fires once per session, but we additionally
// throttle to one alert per (email + 5 min window) here to dedup multi-tab
// reopens and quick refreshes.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";

// Admin SMS numbers (E.164). Add more here as the team grows.
const ADMIN_SMS_NUMBERS = ["+16722581100"];

// Throttle window per email
const THROTTLE_MINUTES = 5;

interface Body {
  email?: string;
  visitor_id?: string;
  page_url?: string;
  referrer?: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = (await req.json().catch(() => null)) as Body | null;
    if (!body || typeof body !== "object") {
      return json({ error: "Invalid JSON body" }, 400);
    }
    const email = body.email ? String(body.email).trim().toLowerCase() : null;
    if (!email) {
      return json({ error: "email is required" }, 400);
    }

    // Throttle: skip if the same email triggered an alert within the last N min
    const sinceIso = new Date(Date.now() - THROTTLE_MINUTES * 60 * 1000).toISOString();
    const { count: recentCount } = await supabase
      .from("notifications_queue")
      .select("id", { count: "exact", head: true })
      .eq("notification_type", "lead_return_visit")
      .gte("created_at", sinceIso)
      .filter("metadata->>email", "eq", email);
    if ((recentCount ?? 0) > 0) {
      return json({ throttled: true, email }, 200);
    }

    // Look up the lead for context
    const { data: leadRow } = await supabase
      .from("project_leads")
      .select("id, name, phone, persona, lead_score, intent_score, project_id, lead_source")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const leadName = leadRow?.name && leadRow.name !== "(pending)" ? leadRow.name : email;
    const pageUrl = body.page_url || "https://presaleproperties.com";
    const visitorId = body.visitor_id || "unknown";

    // Build messages
    const smsBody =
      `🔥 LEAD BACK ON SITE\n` +
      `${leadName}\n` +
      `${email}\n` +
      (leadRow?.phone ? `📞 ${leadRow.phone}\n` : "") +
      (leadRow?.intent_score != null ? `Intent: ${leadRow.intent_score}/100\n` : "") +
      `Page: ${pageUrl}`;

    const pushTitle = `🔥 ${leadName} is back on the site`;
    const pushBody = `${email}${leadRow?.phone ? " • " + leadRow.phone : ""}`;

    // Log to notifications_queue first (audit trail + throttle source)
    const { data: queueRow } = await supabase
      .from("notifications_queue")
      .insert({
        recipient_email: "info@presaleproperties.com",
        recipient_type: "admin",
        notification_type: "lead_return_visit",
        subject: pushTitle,
        body: smsBody,
        metadata: {
          email,
          visitor_id: visitorId,
          page_url: pageUrl,
          referrer: body.referrer ?? null,
          lead_id: leadRow?.id ?? null,
          lead_name: leadName,
          lead_phone: leadRow?.phone ?? null,
          intent_score: leadRow?.intent_score ?? null,
          fired_at: new Date().toISOString(),
        },
        status: "pending",
      })
      .select("id")
      .maybeSingle();

    // Fire Twilio SMS in parallel for every admin number
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");
    const TWILIO_FROM = Deno.env.get("TWILIO_FROM_NUMBER");

    const smsResults: Array<{ to: string; ok: boolean; sid?: string; error?: string }> = [];
    if (LOVABLE_API_KEY && TWILIO_API_KEY && TWILIO_FROM) {
      await Promise.all(
        ADMIN_SMS_NUMBERS.map(async (to) => {
          try {
            const res = await fetch(`${GATEWAY_URL}/Messages.json`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "X-Connection-Api-Key": TWILIO_API_KEY,
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({ To: to, From: TWILIO_FROM, Body: smsBody }),
            });
            const data = await res.json();
            if (!res.ok) {
              smsResults.push({ to, ok: false, error: JSON.stringify(data) });
            } else {
              smsResults.push({ to, ok: true, sid: data.sid });
            }
          } catch (err) {
            smsResults.push({
              to,
              ok: false,
              error: err instanceof Error ? err.message : String(err),
            });
          }
        }),
      );
    } else {
      smsResults.push({ to: "*", ok: false, error: "Twilio env vars missing" });
    }

    // Web push (desktop notification) to every admin's push subscriptions
    let pushSent = 0;
    let pushFailed = 0;
    try {
      const { data: adminUsers } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");
      const adminIds = (adminUsers ?? []).map((r: any) => r.user_id);
      if (adminIds.length > 0) {
        const { data: subs } = await supabase
          .from("push_subscriptions")
          .select("id, endpoint, p256dh, auth, user_id")
          .in("user_id", adminIds);
        for (const sub of subs ?? []) {
          try {
            const r = await supabase.functions.invoke("push-vapid-key", {
              body: {
                subscription: {
                  endpoint: (sub as any).endpoint,
                  keys: { p256dh: (sub as any).p256dh, auth: (sub as any).auth },
                },
                payload: {
                  title: pushTitle,
                  body: pushBody,
                  url: pageUrl,
                  tag: `lead-return-${email}`,
                },
              },
            });
            if (r.error) pushFailed++; else pushSent++;
          } catch {
            pushFailed++;
          }
        }
      }
    } catch (err) {
      console.error("[notify-lead-return] push error", err);
    }

    // Mark queue row as sent
    if (queueRow?.id) {
      await supabase
        .from("notifications_queue")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", queueRow.id);
    }

    return json(
      {
        ok: true,
        email,
        lead_id: leadRow?.id ?? null,
        sms: smsResults,
        push: { sent: pushSent, failed: pushFailed },
      },
      200,
    );
  } catch (err) {
    console.error("[notify-lead-return]", err);
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});

function json(obj: unknown, status: number) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
