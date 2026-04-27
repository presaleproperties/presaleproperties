// bridge-list-neighborhoods — distinct city + neighborhood pairs from
// published presale_projects, for DealsFlow filter dropdowns.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { bridgeJson, checkBridgeAuth, handlePreflight } from "../_shared/bridge.ts";

Deno.serve(async (req) => {
  const pre = handlePreflight(req); if (pre) return pre;
  const auth = checkBridgeAuth(req); if (auth) return auth;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase
      .from("presale_projects")
      .select("city, neighborhood")
      .eq("is_published", true);

    if (error) return bridgeJson({ error: error.message }, 500);

    const byCity = new Map<string, Set<string>>();
    for (const r of data ?? []) {
      const c = (r.city || "").trim();
      const n = (r.neighborhood || "").trim();
      if (!c) continue;
      if (!byCity.has(c)) byCity.set(c, new Set());
      if (n) byCity.get(c)!.add(n);
    }

    const cities = Array.from(byCity.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([city, set]) => ({
        city,
        neighborhoods: Array.from(set).sort((a, b) => a.localeCompare(b)),
      }));

    return bridgeJson({ cities });
  } catch (e) {
    console.error("[bridge-list-neighborhoods]", e);
    return bridgeJson({ error: e instanceof Error ? e.message : "Internal error" }, 500);
  }
});
