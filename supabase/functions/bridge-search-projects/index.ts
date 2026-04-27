// bridge-search-projects — autocomplete/search for DealsFlow project picker.
// Auth: x-bridge-secret header.
// Query: ?q=<text>&city=<text>&status=<text>&limit=<n>

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { bridgeJson, checkBridgeAuth, handlePreflight } from "../_shared/bridge.ts";

Deno.serve(async (req) => {
  const pre = handlePreflight(req); if (pre) return pre;
  const auth = checkBridgeAuth(req); if (auth) return auth;

  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();
    const city = (url.searchParams.get("city") || "").trim();
    const status = (url.searchParams.get("status") || "").trim();
    const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "25", 10), 1), 100);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let query = supabase
      .from("presale_projects")
      .select("id, slug, name, city, neighborhood, developer_name, status, starting_price, price_range, completion_year, featured_image, project_type, is_featured")
      .eq("is_published", true)
      .order("is_featured", { ascending: false })
      .order("view_count", { ascending: false })
      .limit(limit);

    if (q) {
      // Search across name, city, neighborhood, developer
      query = query.or(`name.ilike.%${q}%,city.ilike.%${q}%,neighborhood.ilike.%${q}%,developer_name.ilike.%${q}%`);
    }
    if (city) query = query.eq("city", city);
    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) return bridgeJson({ error: error.message }, 500);

    return bridgeJson({ projects: data ?? [] });
  } catch (e) {
    console.error("[bridge-search-projects]", e);
    return bridgeJson({ error: e instanceof Error ? e.message : "Internal error" }, 500);
  }
});
