// bridge-get-project — full project payload by slug or id.
// Auth: x-bridge-secret header.
// Query: ?slug=<text>  OR  ?id=<uuid>

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { bridgeJson, checkBridgeAuth, handlePreflight } from "../_shared/bridge.ts";

const SITE_BASE = "https://presaleproperties.com";

Deno.serve(async (req) => {
  const pre = handlePreflight(req); if (pre) return pre;
  const auth = checkBridgeAuth(req); if (auth) return auth;

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get("slug");
    const id = url.searchParams.get("id");
    if (!slug && !id) return bridgeJson({ error: "slug or id is required" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let q = supabase.from("presale_projects").select("*").eq("is_published", true).limit(1);
    q = slug ? q.eq("slug", slug) : q.eq("id", id);
    const { data: project, error } = await q.maybeSingle();
    if (error) return bridgeJson({ error: error.message }, 500);
    if (!project) return bridgeJson({ error: "Project not found" }, 404);

    // Optionally hydrate developer
    let developer: any = null;
    if (project.developer_id) {
      const { data: d } = await supabase
        .from("developers")
        .select("id, name, slug, website_url, logo_url, description, founded_year, focus")
        .eq("id", project.developer_id).maybeSingle();
      developer = d;
    }

    // Find an associated pitch deck if one exists for the same project name
    const { data: deck } = await supabase
      .from("pitch_decks")
      .select("slug, project_name, hero_image_url")
      .ilike("project_name", project.name)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const pitch_deck_url = deck?.slug ? `${SITE_BASE}/deck/${deck.slug}` : null;

    return bridgeJson({
      project: {
        ...project,
        project_url: `${SITE_BASE}/properties/${project.slug}`,
        pitch_deck_url,
        developer,
        // Convenience: first floorplan / pricing / brochure URLs
        first_floorplan_url: Array.isArray(project.floorplan_files) ? project.floorplan_files[0] ?? null : null,
        first_pricing_sheet_url: Array.isArray(project.pricing_sheets) ? project.pricing_sheets[0] ?? null : null,
        first_brochure_url: Array.isArray(project.brochure_files) ? project.brochure_files[0] ?? null : null,
      },
    });
  } catch (e) {
    console.error("[bridge-get-project]", e);
    return bridgeJson({ error: e instanceof Error ? e.message : "Internal error" }, 500);
  }
});
