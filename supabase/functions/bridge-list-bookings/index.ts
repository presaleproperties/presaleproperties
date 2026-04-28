// bridge-list-bookings — DealsFlow CRM pulls showing/consult bookings.
//
// GET query params (all optional):
//   email=<addr>            filter by lead email
//   status=<status>         pending | confirmed | cancelled | completed
//   from=<YYYY-MM-DD>       appointment_date >= from
//   to=<YYYY-MM-DD>         appointment_date <= to
//   since=<ISO>             created_at >= since (for incremental sync)
//   limit=<n>               default 100, max 500
//
// Auth: x-bridge-secret header.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { bridgeJson, checkBridgeAuth, handlePreflight } from "../_shared/bridge.ts";

Deno.serve(async (req) => {
  const pre = handlePreflight(req); if (pre) return pre;
  const auth = checkBridgeAuth(req); if (auth) return auth;

  try {
    const url = new URL(req.url);
    const email = (url.searchParams.get("email") || "").trim().toLowerCase() || null;
    const status = url.searchParams.get("status");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const since = url.searchParams.get("since");
    const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "100", 10), 1), 500);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let q = supabase
      .from("bookings")
      .select(`
        id, appointment_type, appointment_date, appointment_time, status,
        project_id, project_name, project_url, project_city, project_neighborhood,
        name, email, phone, buyer_type, timeline, notes,
        lead_source, utm_source, utm_medium, utm_campaign, referrer,
        visitor_id, intent_score, city_interest, project_interest,
        created_at, updated_at, confirmed_at, cancelled_at
      `)
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true })
      .limit(limit);

    if (email) q = q.eq("email", email);
    if (status) q = q.eq("status", status);
    if (from) q = q.gte("appointment_date", from);
    if (to) q = q.lte("appointment_date", to);
    if (since) q = q.gte("created_at", since);

    const { data, error } = await q;
    if (error) return bridgeJson({ error: error.message }, 500);

    return bridgeJson({ bookings: data ?? [], count: data?.length ?? 0 });
  } catch (err) {
    console.error("[bridge-list-bookings]", err);
    return bridgeJson({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
