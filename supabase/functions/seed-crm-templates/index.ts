// One-time seed runner. Public endpoint pinged by the frontend on app load.
// Checks the system_flags table; if seed hasn't run, invokes
// sync-templates-with-crm and flips the flag. All subsequent calls are no-ops.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const FLAG_KEY = "crm_templates_seed_completed";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const { data: flag } = await supabase
      .from("system_flags")
      .select("value")
      .eq("key", FLAG_KEY)
      .maybeSingle();

    const completed = (flag?.value as { completed?: boolean } | null)?.completed === true;
    if (completed) {
      return json({ ok: true, skipped: true, reason: "already_seeded" }, 200);
    }

    // Mark as completed FIRST to avoid concurrent double-runs from multiple
    // simultaneous app loads. Sync runs are idempotent anyway.
    await supabase
      .from("system_flags")
      .upsert({
        key: FLAG_KEY,
        value: { completed: true, seeded_at: new Date().toISOString() },
        updated_at: new Date().toISOString(),
      });

    // Fire the sync (don't await long — invoke and return quickly)
    const { data, error } = await supabase.functions.invoke(
      "sync-templates-with-crm?triggered_by=auto_seed",
      { body: {} },
    );

    if (error) {
      // Roll back flag so a later app load retries
      await supabase
        .from("system_flags")
        .upsert({ key: FLAG_KEY, value: { completed: false }, updated_at: new Date().toISOString() });
      console.error("[seed-crm-templates] sync invoke failed", error);
      return json({ ok: false, error: error.message }, 500);
    }

    return json({ ok: true, seeded: true, result: data }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[seed-crm-templates]", err);
    return json({ ok: false, error: message }, 500);
  }
});

function json(obj: unknown, status: number) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
