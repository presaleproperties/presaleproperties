// crm-webhook-inbound — single endpoint the DealzFlow CRM POSTs to whenever
// something changes on its side that the website needs to know:
//
//   - contact stage change (lead → opportunity → customer)
//   - agent assignment / reassignment
//   - tags added/removed
//   - contact merged (CRM dedupe)
//   - deal won (fires Meta CAPI server conversion using original event_id)
//
// Authenticated via x-bridge-secret header (shared with all bridge functions).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-bridge-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface InboundEvent {
  type: "contact.upsert" | "contact.stage_changed" | "contact.agent_assigned"
      | "contact.tags_changed" | "contact.merged" | "deal.won";
  email?: string;
  presale_user_id?: string;
  phone?: string;
  crm_contact_id?: string;
  data?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const expected = Deno.env.get("BRIDGE_SECRET");
  const provided = req.headers.get("x-bridge-secret");
  if (!expected || provided !== expected) {
    return json({ error: "unauthorized" }, 401);
  }

  try {
    const event = (await req.json()) as InboundEvent;
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Always upsert into the identity map
    const upsertPayload: Record<string, unknown> = {
      email: event.email,
      presale_user_id: event.presale_user_id,
      phone: event.phone,
      crm_contact_id: event.crm_contact_id,
      ...(event.data ?? {}),
      last_activity_at: new Date().toISOString(),
    };
    const { error: upsertErr } = await supabase.rpc("upsert_crm_identity", {
      p_data: upsertPayload,
    });
    if (upsertErr) console.error("[crm-webhook-inbound] upsert", upsertErr);

    // Type-specific side effects
    switch (event.type) {
      case "contact.stage_changed": {
        if (event.email && event.data?.lifecycle_stage) {
          await supabase.from("project_leads")
            .update({ status: String(event.data.lifecycle_stage) })
            .eq("email", event.email);
        }
        break;
      }
      case "contact.merged": {
        // CRM merged two contacts — collapse our identity_map rows too
        const surviving = String(event.data?.surviving_email || event.email || "");
        const dropped = String(event.data?.dropped_email || "");
        if (surviving && dropped && surviving !== dropped) {
          await supabase.from("crm_identity_map").delete().eq("email", dropped);
        }
        break;
      }
      case "deal.won": {
        // Re-fire Meta CAPI Purchase using the lead's original event_id for dedup
        const eventId = event.data?.event_id as string | undefined;
        const value = event.data?.value as number | undefined;
        if (eventId && event.email) {
          await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/meta-conversions-api`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({
              event_name: "Purchase",
              event_id: eventId,
              email: event.email,
              value,
              currency: "CAD",
            }),
          }).catch(() => {});
        }
        break;
      }
    }

    return json({ ok: true });
  } catch (err) {
    console.error("[crm-webhook-inbound]", err);
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
