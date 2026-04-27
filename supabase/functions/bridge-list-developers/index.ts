// bridge-list-developers — active developers for DealsFlow filters/dropdowns.

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
      .from("developers")
      .select("id, name, slug, website_url, logo_url, city, cities_active, founded_year, focus, project_count, is_active")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) return bridgeJson({ error: error.message }, 500);
    return bridgeJson({ developers: data ?? [] });
  } catch (e) {
    console.error("[bridge-list-developers]", e);
    return bridgeJson({ error: e instanceof Error ? e.message : "Internal error" }, 500);
  }
});
