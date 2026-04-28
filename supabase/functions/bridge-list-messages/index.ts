// Endpoint for DealsFlow to pull messages logged on the website.
// Auth: x-bridge-secret header. Supports filters: email, lead_id, since, channel, limit.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-bridge-secret",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const provided = req.headers.get("x-bridge-secret") ?? "";
  const expected = Deno.env.get("BRIDGE_SECRET") ?? "";
  if (!expected || provided !== expected) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const url = new URL(req.url);
    const email = url.searchParams.get("email");
    const leadId = url.searchParams.get("lead_id");
    const since = url.searchParams.get("since");
    const channel = url.searchParams.get("channel");
    const sourceFilter = url.searchParams.get("source") ?? "website"; // default: only website-originated
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "200", 10) || 200, 1000);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let q = supabase
      .from("crm_messages")
      .select("*")
      .order("occurred_at", { ascending: false })
      .limit(limit);

    if (email) q = q.eq("email", email.toLowerCase().trim());
    if (leadId) q = q.eq("lead_id", leadId);
    if (since) q = q.gte("occurred_at", since);
    if (channel) q = q.eq("channel", channel);
    if (sourceFilter && sourceFilter !== "all") q = q.eq("source", sourceFilter);

    const { data, error } = await q;
    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, count: data?.length ?? 0, messages: data ?? [] }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[bridge-list-messages] error:", e);
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
