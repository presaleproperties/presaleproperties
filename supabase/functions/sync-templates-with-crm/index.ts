// Two-way template sync between Presale's email_templates table and the
// DealzFlow CRM. Run on schedule via pg_cron OR trigger manually.
//
// Strategy:
//   1. PULL: GET CRM templates → upsert any that are newer (sync_hash mismatch)
//   2. PUSH: POST Presale-origin templates back to CRM

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const CRM_TEMPLATES_URL = "https://svbilqvudkkdhslxebce.supabase.co/functions/v1/bridge-templates-sync";
const TEMPLATES_TABLE = "email_templates";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-bridge-secret",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

async function hashContent(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const bridgeSecret = Deno.env.get("BRIDGE_SECRET");
    if (!bridgeSecret) return json({ error: "BRIDGE_SECRET not configured" }, 500);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1. PULL from CRM
    let pulled = 0;
    const pullRes = await fetch(CRM_TEMPLATES_URL, {
      headers: { "x-bridge-secret": bridgeSecret },
    });

    if (!pullRes.ok) {
      console.error("[sync-templates-with-crm] pull failed", pullRes.status, await pullRes.text());
    } else {
      const { templates: crmTemplates = [] } = await pullRes.json();

      for (const t of crmTemplates) {
        const { data: existing } = await supabase
          .from(TEMPLATES_TABLE)
          .select("id, sync_hash")
          .eq("crm_id", t.id)
          .maybeSingle();

        if (existing && existing.sync_hash === t.sync_hash) continue;

        const row = {
          name: t.name,
          subject: t.subject,
          body_html: t.body_html,
          html_content: t.body_html, // mirror to required NOT NULL column
          category: t.category,
          merge_tags: t.merge_tags || [],
          sync_hash: t.sync_hash,
          last_synced_at: new Date().toISOString(),
        };

        if (existing) {
          await supabase.from(TEMPLATES_TABLE).update(row).eq("id", existing.id);
        } else {
          await supabase.from(TEMPLATES_TABLE).insert({
            ...row,
            crm_id: t.id,
            source: "crm",
            template_type: t.category || "crm_bridge",
          });
        }
        pulled++;
      }
    }

    // 2. PUSH Presale-origin templates back to CRM
    const { data: localTemplates = [] } = await supabase
      .from(TEMPLATES_TABLE)
      .select("id, name, subject, body_html, html_content, category, merge_tags, sync_hash")
      .eq("source", "presale");

    const pushPayload = await Promise.all(((localTemplates as any[]) || []).map(async (t) => {
      const html = t.body_html || t.html_content || "";
      return {
        external_id: t.id,
        name: t.name,
        subject: t.subject,
        body_html: html,
        category: t.category,
        merge_tags: t.merge_tags || [],
        sync_hash: await hashContent(`${t.subject}|${html}`),
      };
    }));

    const pushRes = await fetch(CRM_TEMPLATES_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-bridge-secret": bridgeSecret },
      body: JSON.stringify({ templates: pushPayload }),
    });

    let pushResult: unknown = null;
    try { pushResult = await pushRes.json(); } catch { pushResult = { ok: pushRes.ok }; }

    return json({ ok: true, pulled, pushed: pushPayload.length, pushResult }, 200);
  } catch (err) {
    console.error("[sync-templates-with-crm]", err);
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});

function json(obj: unknown, status: number) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
