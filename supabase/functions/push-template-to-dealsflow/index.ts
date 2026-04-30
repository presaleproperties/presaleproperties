// Forwards a template save/delete to DealsFlow's bridge-templates-sync.
// The BRIDGE_SECRET stays server-side; the client just calls this function.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DEALSFLOW_URL =
  "https://svbilqvudkkdhslxebce.supabase.co/functions/v1/bridge-templates-sync";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const secret = Deno.env.get("BRIDGE_SECRET");
    if (!secret) {
      return json({ error: "BRIDGE_SECRET not configured" }, 500);
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return json({ error: "Invalid JSON body" }, 400);
    }

    // Required fields
    const required = ["external_id", "name", "owner_scope"];
    for (const f of required) {
      if (!body[f]) return json({ error: `Missing field: ${f}` }, 400);
    }

    const payload = {
      external_id: String(body.external_id),
      name: String(body.name || ""),
      subject: String(body.subject || body.name || ""),
      body_html: String(body.body_html || body.html || ""),
      owner_scope: String(body.owner_scope),
      owner_agent_slug: body.owner_agent_slug ?? null,
      created_by_agent_slug: body.created_by_agent_slug ?? null,
      project: body.project ?? null,
      category: body.category ?? null,
      merge_tags: Array.isArray(body.merge_tags) ? body.merge_tags : [],
      sync_hash: body.sync_hash ?? null,
      deleted: body.deleted === true,
      source: "presale_properties",
    };

    const upstream = await fetch(DEALSFLOW_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-bridge-secret": secret,
      },
      body: JSON.stringify(payload),
    });

    const text = await upstream.text();
    let parsed: unknown = text;
    try { parsed = JSON.parse(text); } catch { /* keep text */ }

    if (!upstream.ok) {
      console.error("[push-template-to-dealsflow] upstream error", upstream.status, text);
      return json({ ok: false, status: upstream.status, response: parsed }, 502);
    }

    return json({ ok: true, response: parsed }, 200);
  } catch (e) {
    console.error("[push-template-to-dealsflow]", e);
    return json({ error: e instanceof Error ? e.message : "Internal error" }, 500);
  }
});

function json(obj: unknown, status: number) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
