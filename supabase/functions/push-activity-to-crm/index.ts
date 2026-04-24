// Pushes a behavior/activity event to the DealzFlow CRM via the bridge.
// Used for real-time forwarding of client_activity rows, deck_visits,
// and Lofty-tracked engagement events.
//
// Contract: POST { event_type, visitor_id, email?, payload } to bridge-ingest-lead
// (the CRM bridge dedups on visitor_id → email → phone).

const CRM_INGEST_URL = "https://svbilqvudkkdhslxebce.supabase.co/functions/v1/bridge-ingest-lead";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-bridge-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const bridgeSecret = Deno.env.get("BRIDGE_SECRET");
    if (!bridgeSecret) {
      return json({ error: "BRIDGE_SECRET is not configured" }, 500);
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return json({ error: "Invalid JSON body" }, 400);
    }

    const {
      event_type,
      visitor_id,
      email,
      session_id,
      payload,
      source,
      presale_user_id,
      first_name,
      last_name,
      phone,
    } = body as {
      event_type?: string;
      visitor_id?: string;
      email?: string;
      session_id?: string;
      payload?: Record<string, unknown>;
      source?: string;
      presale_user_id?: string;
      first_name?: string;
      last_name?: string;
      phone?: string;
    };

    if (!event_type) return json({ error: "event_type is required" }, 400);

    // CRM bridge requires lead.email. Skip anonymous events (visitor_id-only)
    // since they cannot be stitched to a contact without an email yet.
    const normalizedEmail = email ? String(email).trim().toLowerCase() : null;
    if (!normalizedEmail) {
      return json({ skipped: true, reason: "no_email_for_stitching" }, 200);
    }

    const crmPayload = {
      lead: {
        email: normalizedEmail,
        ...(first_name ? { first_name } : {}),
        ...(last_name ? { last_name } : {}),
        ...(phone ? { phone } : {}),
        ...(presale_user_id ? { presale_user_id } : {}),
        source: source ?? "presale_properties",
      },
      behavior: {
        event_type,
        visitor_id,
        session_id,
        email: normalizedEmail,
        source: source ?? "presale_properties",
        timestamp: new Date().toISOString(),
        payload: payload ?? {},
      },
    };

    const res = await fetch(CRM_INGEST_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-bridge-secret": bridgeSecret,
      },
      body: JSON.stringify(crmPayload),
    });

    const text = await res.text();
    let data: unknown;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (!res.ok) {
      console.error("[push-activity-to-crm] CRM error", res.status, text);
    }

    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[push-activity-to-crm]", err);
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});

function json(obj: unknown, status: number) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
