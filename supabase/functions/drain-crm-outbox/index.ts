// drain-crm-outbox — runs every minute, retries failed CRM deliveries with
// exponential backoff. Marks rows synced/failed/dead.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_ATTEMPTS = 8;       // ~ covers 6+ hours of retries
const BATCH_SIZE = 50;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function backoffSeconds(attempt: number): number {
  // 30s, 1m, 2m, 5m, 15m, 30m, 1h, 2h
  const ladder = [30, 60, 120, 300, 900, 1800, 3600, 7200];
  return ladder[Math.min(attempt, ladder.length - 1)];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const startedAt = Date.now();

  try {
    // 1. Atomically claim a batch of pending rows
    const { data: claimed, error: claimErr } = await supabase
      .from("crm_outbox")
      .update({ status: "processing", updated_at: new Date().toISOString() })
      .in("status", ["pending", "failed"])
      .lte("next_attempt_at", new Date().toISOString())
      .lt("attempts", MAX_ATTEMPTS)
      .order("next_attempt_at", { ascending: true })
      .limit(BATCH_SIZE)
      .select("*");

    if (claimErr) throw claimErr;
    if (!claimed || claimed.length === 0) {
      return json({ ok: true, drained: 0, ms: Date.now() - startedAt });
    }

    let synced = 0;
    let failed = 0;

    // 2. Deliver each row to its endpoint
    for (const row of claimed) {
      const fnUrl = `${SUPABASE_URL}/functions/v1/${row.endpoint}`;
      try {
        const res = await fetch(fnUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SERVICE_KEY}`,
          },
          body: JSON.stringify(row.payload),
        });
        const text = await res.text();
        if (!res.ok) throw new Error(`${res.status}: ${text.slice(0, 500)}`);

        await supabase.from("crm_outbox").update({
          status: "synced",
          synced_at: new Date().toISOString(),
          attempts: row.attempts + 1,
          last_error: null,
        }).eq("id", row.id);
        synced++;
      } catch (err) {
        const attempts = row.attempts + 1;
        const dead = attempts >= MAX_ATTEMPTS;
        await supabase.from("crm_outbox").update({
          status: dead ? "dead" : "failed",
          attempts,
          last_error: err instanceof Error ? err.message : String(err),
          next_attempt_at: new Date(Date.now() + backoffSeconds(attempts) * 1000).toISOString(),
        }).eq("id", row.id);
        failed++;
      }
    }

    return json({ ok: true, drained: claimed.length, synced, failed, ms: Date.now() - startedAt });
  } catch (err) {
    console.error("[drain-crm-outbox]", err);
    return json({ ok: false, error: err instanceof Error ? err.message : String(err) }, 500);
  }
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
