// Forwards a behavior/activity event to the DealsFlow CRM inbound webhook
// (`receive-presale-activity`). Uses the shared BRIDGE_SECRET via the
// `x-bridge-secret` header. Auth on DealsFlow side is `verify_jwt = false`.
//
// Inbound contract (what callers POST to this function):
//   { event_type, visitor_id?, email?, session_id?, payload?,
//     source?, presale_user_id?, first_name?, last_name?, phone? }
//
// Outbound contract (what we POST to DealsFlow):
//   { type, lead_email?, lead_phone?, project_slug?, agent_slug?,
//     metadata?, occurred_at? }

const CRM_INGEST_URL =
  Deno.env.get("DEALSFLOW_WEBHOOK_URL") ||
  "https://svbilqvudkkdhslxebce.supabase.co/functions/v1/receive-presale-activity";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-bridge-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const bridgeSecret = Deno.env.get("BRIDGE_SECRET");
    if (!bridgeSecret) return json({ error: "BRIDGE_SECRET is not configured" }, 500);

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return json({ error: "Invalid JSON body" }, 400);

    const {
      event_type, visitor_id, email, session_id, payload,
      source, presale_user_id, first_name, last_name, phone,
    } = body as Record<string, any>;

    if (!event_type) return json({ error: "event_type is required" }, 400);

    const normalizedEmail = email ? String(email).trim().toLowerCase() : null;
    const normalizedPhone = phone ? String(phone).trim() : null;

    // DealsFlow requires email OR phone for stitching
    if (!normalizedEmail && !normalizedPhone) {
      return json({ skipped: true, reason: "no_identifier" }, 200);
    }

    const p = (payload ?? {}) as Record<string, any>;

    // Promote known fields out of payload into top-level CRM fields.
    const project_slug = p.project_slug ?? p.slug ?? p.project ?? undefined;
    const agent_slug = p.agent_slug ?? p.agent ?? undefined;

    const metadata: Record<string, any> = {
      ...p,
      visitor_id,
      session_id,
      source: source ?? "presale_properties",
      ...(presale_user_id ? { presale_user_id } : {}),
      ...(first_name ? { first_name } : {}),
      ...(last_name ? { last_name } : {}),
    };

    const crmPayload = {
      type: event_type,
      ...(normalizedEmail ? { lead_email: normalizedEmail } : {}),
      ...(normalizedPhone ? { lead_phone: normalizedPhone } : {}),
      ...(project_slug ? { project_slug } : {}),
      ...(agent_slug ? { agent_slug } : {}),
      metadata,
      occurred_at: new Date().toISOString(),
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

    if (!res.ok) console.error("[push-activity-to-crm] CRM error", res.status, text);

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
