// Streams anonymous/known visitor behavior to the DealzFlow CRM.
//
// This is a thin server-side proxy so the BRIDGE_SECRET never leaves the
// edge runtime. Accepts:
//   { presale_user_id: string, email?: string, behavior: { sessions, views, forms } }
// and forwards to the CRM's bridge-ingest-behavior endpoint.

const CRM_BEHAVIOR_URL = "https://svbilqvudkkdhslxebce.supabase.co/functions/v1/bridge-ingest-behavior";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const bridgeSecret = Deno.env.get("BRIDGE_SECRET");
    if (!bridgeSecret) return json({ error: "BRIDGE_SECRET is not configured" }, 500);

    const body = await req.json().catch(() => null) as
      | { presale_user_id?: string; email?: string; behavior?: unknown }
      | null;

    if (!body || typeof body !== "object") return json({ error: "Invalid JSON body" }, 400);
    if (!body.presale_user_id) return json({ error: "presale_user_id is required" }, 400);
    if (!body.behavior || typeof body.behavior !== "object") {
      return json({ error: "behavior is required" }, 400);
    }

    const beh = body.behavior as { sessions?: any[]; views?: any[]; forms?: any[] };
    const events: Array<Record<string, unknown>> = [];
    for (const s of beh.sessions ?? []) events.push({ type: "session", ...s });
    for (const v of beh.views ?? []) events.push({ type: "property_view", ...v });
    for (const f of beh.forms ?? []) events.push({ type: "form", ...f });

    const payload = {
      identity: {
        presale_user_id: body.presale_user_id,
        ...(body.email ? { email: String(body.email).trim().toLowerCase() } : {}),
      },
      events,
    };

    const res = await fetch(CRM_BEHAVIOR_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-bridge-secret": bridgeSecret,
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let data: unknown;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (!res.ok) {
      console.error("[bridge-stream-behavior] CRM error", res.status, text);
    }

    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[bridge-stream-behavior]", err);
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});

function json(obj: unknown, status: number) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
