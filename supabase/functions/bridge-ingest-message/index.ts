// Endpoint for DealsFlow CRM to push a message/note/call/SMS/email back into the website.
// Auth: x-bridge-secret header.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-bridge-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED_CHANNELS = ["note", "sms", "call", "email", "whatsapp", "meeting", "task_comment"];
const ALLOWED_DIRECTIONS = ["inbound", "outbound", "internal"];

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
    const body = await req.json();
    const messages = Array.isArray(body?.messages) ? body.messages : [body];

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const rows = messages.map((m: any) => {
      const channel = String(m.channel ?? "note").toLowerCase();
      const direction = String(m.direction ?? "inbound").toLowerCase();
      return {
        email: m.email ? String(m.email).toLowerCase().trim() : null,
        phone: m.phone ?? null,
        crm_contact_id: m.crm_contact_id ?? null,
        channel: ALLOWED_CHANNELS.includes(channel) ? channel : "note",
        direction: ALLOWED_DIRECTIONS.includes(direction) ? direction : "inbound",
        body: m.body ?? null,
        subject: m.subject ?? null,
        author_type: m.author_type ?? "crm",
        author_name: m.author_name ?? null,
        author_email: m.author_email ?? null,
        source: "dealsflow",
        external_id: m.external_id ?? m.id ?? null,
        sync_status: "skip", // do not re-push to CRM
        synced_to_crm_at: new Date().toISOString(),
        occurred_at: m.occurred_at ?? new Date().toISOString(),
        metadata: m.metadata ?? {},
      };
    });

    // Upsert on (source, external_id) to avoid duplicates
    const { data, error } = await supabase
      .from("crm_messages")
      .upsert(rows, { onConflict: "source,external_id", ignoreDuplicates: false })
      .select("id, external_id");

    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, count: data?.length ?? 0, ids: data }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[bridge-ingest-message] error:", e);
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
