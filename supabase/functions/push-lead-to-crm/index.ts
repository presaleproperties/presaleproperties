// Pushes a lead + behavior payload to the DealzFlow CRM via the bridge.
// Contract: see _bridge/SHARED_SCHEMA.md on the CRM project.

const CRM_INGEST_URL = "https://svbilqvudkkdhslxebce.supabase.co/functions/v1/bridge-ingest-lead";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const bridgeSecret = Deno.env.get("BRIDGE_SECRET");
    if (!bridgeSecret) {
      return json({ error: "BRIDGE_SECRET is not configured" }, 500);
    }

    const payload = await req.json();
    if (!payload?.lead?.email) {
      return json({ error: "lead.email is required" }, 400);
    }

    const res = await fetch(CRM_INGEST_URL, {
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
      console.error("[push-lead-to-crm] CRM error", res.status, text);
    }
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[push-lead-to-crm]", err);
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});

function json(obj: unknown, status: number) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
