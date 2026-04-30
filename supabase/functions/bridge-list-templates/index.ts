// Exposes Presale's campaign_templates to the DealsFlow CRM.
// Server-side filters by agent_slug + include_team so a CRM bug can never
// leak another agent's templates. Gated by shared BRIDGE_SECRET.

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

    let agentSlug: string | null = null;
    let includeTeam = true;

    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (typeof body?.agent_slug === "string") agentSlug = body.agent_slug.trim().toLowerCase();
        if (typeof body?.include_team === "boolean") includeTeam = body.include_team;
      } catch { /* allow empty body */ }
    } else {
      const url = new URL(req.url);
      agentSlug = url.searchParams.get("agent_slug")?.toLowerCase() ?? null;
      const it = url.searchParams.get("include_team");
      if (it !== null) includeTeam = it !== "false";
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let query = supabase
      .from("campaign_templates")
      .select(
        "id, slug, name, project_name, form_data, thumbnail_url, tags, " +
        "owner_scope, owner_agent_slug, created_by_agent_slug, sync_hash, " +
        "is_active, created_at, updated_at"
      )
      .eq("is_active", true)
      .order("updated_at", { ascending: false });

    // Server-side scope filter (defense in depth)
    if (agentSlug && includeTeam) {
      query = query.or(`owner_agent_slug.eq.${agentSlug},owner_scope.like.team:%`);
    } else if (agentSlug && !includeTeam) {
      query = query.eq("owner_agent_slug", agentSlug);
    } else if (!agentSlug && includeTeam) {
      query = query.like("owner_scope", "team:%");
    } else {
      // No agent and no team requested → return nothing.
      return json({ templates: [] }, 200);
    }

    const { data, error } = await query;
    if (error) return json({ error: error.message }, 500);

    const templates = (data ?? []).map((t: any) => {
      const fd = t.form_data || {};
      const copy = fd.copy || {};
      return {
        id: t.id,
        slug: t.slug,
        name: t.name || fd.projectName || t.project_name || "Untitled",
        subject: copy.subjectLine || fd.projectName || t.project_name || "Presale Properties",
        body_html: fd.finalHtml || "",
        preview_text: copy.previewText || null,
        category: fd.category || "general",
        project_slug: fd.projectSlug || null,
        merge_tags: Array.isArray(fd.mergeTags) ? fd.mergeTags : [],
        thumbnail: t.thumbnail_url || fd.heroImage || null,
        tags: t.tags || [],
        owner_scope: t.owner_scope,
        owner_agent_slug: t.owner_agent_slug,
        created_by_agent_slug: t.created_by_agent_slug,
        sync_hash: t.sync_hash,
        is_active: t.is_active,
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
