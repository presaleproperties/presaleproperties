// Exposes Presale's campaign_templates so the DealzFlow CRM can show them
// in its unified template picker. Gated by shared BRIDGE_SECRET.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-bridge-secret",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const expected = Deno.env.get("BRIDGE_SECRET");
    const provided = req.headers.get("x-bridge-secret") || "";
    if (!expected || provided !== expected) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase
      .from("campaign_templates")
      .select("id, name, project_name, form_data, thumbnail_url, tags, created_at, updated_at")
      .order("updated_at", { ascending: false });

    if (error) return json({ error: error.message }, 500);

    const templates = (data ?? []).map((t: any) => {
      const fd = t.form_data || {};
      const copy = fd.copy || {};
      return {
        id: t.id,
        name: t.name || fd.projectName || t.project_name || "Untitled",
        subject: copy.subjectLine || fd.projectName || t.project_name || "Presale Properties",
        body_html: fd.finalHtml || "",
        category: fd.category || "general",
        thumbnail: t.thumbnail_url || fd.heroImage || null,
        tags: t.tags || [],
        updated_at: t.updated_at,
        source: "presale_properties",
      };
    });

    return json({ templates }, 200);
  } catch (e) {
    console.error("[bridge-list-templates]", e);
    return json({ error: e instanceof Error ? e.message : "Internal error" }, 500);
  }
});

function json(obj: unknown, status: number) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
