import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CRM_URL = "https://svbilqvudkkdhslxebce.supabase.co/functions/v1/bridge-stitch-identities";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const bridgeSecret = Deno.env.get("BRIDGE_SECRET");
    if (!bridgeSecret) {
      return new Response(JSON.stringify({ error: "BRIDGE_SECRET not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let body: any = {};
    try { body = await req.json(); } catch (_) {}
    const mode = body.mode === "report" ? "report" : "push";
    const force = body.force === true;
    const batchSize = Math.min(Math.max(parseInt(body.batchSize) || 2000, 1), 5000);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Pull from clients
    const clientsMap = new Map<string, string>();
    let cFrom = 0;
    const pageSize = 1000;
    while (true) {
      const { data, error } = await supabase
        .from("clients")
        .select("id, email")
        .not("email", "is", null)
        .range(cFrom, cFrom + pageSize - 1);
      if (error) throw new Error(`clients fetch failed: ${error.message}`);
      if (!data || data.length === 0) break;
      for (const r of data) {
        const email = String(r.email || "").trim().toLowerCase();
        if (!email || !r.id) continue;
        if (!clientsMap.has(email)) clientsMap.set(email, r.id);
      }
      if (data.length < pageSize) break;
      cFrom += pageSize;
    }

    // Pull from project_leads (user_id may be null for many)
    const leadsMap = new Map<string, string>();
    let lFrom = 0;
    while (true) {
      const { data, error } = await supabase
        .from("project_leads")
        .select("user_id, email")
        .not("email", "is", null)
        .not("user_id", "is", null)
        .range(lFrom, lFrom + pageSize - 1);
      if (error) throw new Error(`project_leads fetch failed: ${error.message}`);
      if (!data || data.length === 0) break;
      for (const r of data) {
        const email = String(r.email || "").trim().toLowerCase();
        if (!email || !r.user_id) continue;
        if (!leadsMap.has(email)) leadsMap.set(email, r.user_id);
      }
      if (data.length < pageSize) break;
      lFrom += pageSize;
    }

    // Merge — clients win
    const merged = new Map<string, string>();
    for (const [email, id] of leadsMap) merged.set(email, id);
    for (const [email, id] of clientsMap) merged.set(email, id);

    const mappings = Array.from(merged, ([email, presale_user_id]) => ({ email, presale_user_id }));
    const totalUniqueEmails = mappings.length;
    const fromClients = clientsMap.size;
    const fromLeads = leadsMap.size;
    const batchCount = Math.ceil(totalUniqueEmails / batchSize);

    if (mode === "report") {
      return new Response(
        JSON.stringify({ mode, totalUniqueEmails, fromClients, fromLeads, batchCount, batchSize }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Push mode
    const totals = { updated: 0, skipped: 0, conflicts: 0, notFound: 0 };
    const batchResults: any[] = [];
    let batchIdx = 0;

    for (let i = 0; i < mappings.length; i += batchSize) {
      batchIdx++;
      const batch = mappings.slice(i, i + batchSize);
      console.log(`[bridge-stitch-identities] Pushing batch ${batchIdx}/${batchCount} (${batch.length} mappings)`);

      const resp = await fetch(CRM_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-bridge-secret": bridgeSecret,
        },
        body: JSON.stringify({ mode: "batch", force, mappings: batch }),
      });

      const text = await resp.text();
      let parsed: any = null;
      try { parsed = JSON.parse(text); } catch (_) { parsed = { raw: text }; }

      if (!resp.ok) {
        console.error(`[bridge-stitch-identities] Batch ${batchIdx} failed: ${resp.status}`, text);
        return new Response(
          JSON.stringify({
            error: `CRM batch ${batchIdx} failed`,
            status: resp.status,
            response: parsed,
            partialTotals: totals,
            completedBatches: batchIdx - 1,
          }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      totals.updated += Number(parsed.updated || 0);
      totals.skipped += Number(parsed.skipped || 0);
      totals.conflicts += Number(parsed.conflicts || 0);
      totals.notFound += Number(parsed.notFound || 0);
      batchResults.push({ batch: batchIdx, size: batch.length, ...parsed });
    }

    return new Response(
      JSON.stringify({
        mode,
        totalUniqueEmails,
        fromClients,
        fromLeads,
        batchCount,
        totals,
        batches: batchResults,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[bridge-stitch-identities] Error:", err);
    return new Response(JSON.stringify({ error: err.message || String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
