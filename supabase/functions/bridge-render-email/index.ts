// bridge-render-email — keystone endpoint.
// DealsFlow posts: { project_slug, agent_id|agent_email, recipient: {name, email},
//                    assets?: ['floorplan','pricing','brochure','pitchdeck'],
//                    custom_intro?: string, subject_override?: string,
//                    preheader?: string }
// Returns: { subject, html, agent, project }
//
// HTML matches Presale's signature/styling, so DealsFlow can preview-and-send
// pixel-identical emails.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { bridgeJson, checkBridgeAuth, handlePreflight } from "../_shared/bridge.ts";
import {
  renderAgentSignatureHtml,
  renderProjectCardHtml,
  renderEmailDocument,
  type BridgeAgent,
  type BridgeProject,
} from "../_shared/bridge-email-renderer.ts";

const SITE_BASE = "https://presaleproperties.com";
const AGENT_WEBSITE_URLS: Record<string, string> = {
  Uzair: "https://presalewithuzair.com/",
};

interface RenderBody {
  project_slug?: string;
  project_id?: string;
  agent_id?: string;
  agent_email?: string;
  agent_auth_user_id?: string;
  recipient?: { name?: string; email?: string };
  assets?: Array<"floorplan" | "pricing" | "brochure" | "pitchdeck">;
  custom_intro?: string;
  subject_override?: string;
  preheader?: string;
}

Deno.serve(async (req) => {
  const pre = handlePreflight(req); if (pre) return pre;
  const auth = checkBridgeAuth(req); if (auth) return auth;

  try {
    const body = (await req.json().catch(() => null)) as RenderBody | null;
    if (!body) return bridgeJson({ error: "Invalid JSON body" }, 400);

    const { project_slug, project_id, agent_id, agent_email, agent_auth_user_id,
            recipient, assets = [], custom_intro, subject_override, preheader } = body;

    if (!project_slug && !project_id) return bridgeJson({ error: "project_slug or project_id required" }, 400);
    if (!agent_id && !agent_email && !agent_auth_user_id) {
      return bridgeJson({ error: "agent_id, agent_email, or agent_auth_user_id required" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Fetch project
    let projQ = supabase.from("presale_projects").select("*").eq("is_published", true).limit(1);
    projQ = project_slug ? projQ.eq("slug", project_slug) : projQ.eq("id", project_id!);
    const { data: project, error: projErr } = await projQ.maybeSingle();
    if (projErr) return bridgeJson({ error: projErr.message }, 500);
    if (!project) return bridgeJson({ error: "Project not found" }, 404);

    // Fetch agent
    let resolvedEmail = agent_email?.toLowerCase() || "";
    if (!resolvedEmail && agent_auth_user_id) {
      const { data } = await (supabase.auth.admin as any).getUserById(agent_auth_user_id);
      resolvedEmail = data?.user?.email?.toLowerCase() || "";
    }
    let agentQ = supabase.from("team_members").select("*").eq("is_active", true).limit(1);
    if (agent_id) agentQ = agentQ.eq("id", agent_id);
    else if (resolvedEmail) agentQ = agentQ.ilike("email", resolvedEmail);
    const { data: m, error: agentErr } = await agentQ.maybeSingle();
    if (agentErr) return bridgeJson({ error: agentErr.message }, 500);
    if (!m) return bridgeJson({ error: "Agent not found" }, 404);

    const websiteUrl = AGENT_WEBSITE_URLS[(m.full_name || "").split(" ")[0]] ?? null;
    const agent: BridgeAgent = {
      full_name: m.full_name, title: m.title, photo_url: m.photo_url,
      phone: m.phone, email: m.email, website_url: websiteUrl,
    };

    // Pitch deck lookup
    let pitch_deck_url: string | null = null;
    if (assets.includes("pitchdeck")) {
      const { data: deck } = await supabase
        .from("pitch_decks").select("slug")
        .ilike("project_name", project.name)
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (deck?.slug) pitch_deck_url = `${SITE_BASE}/deck/${deck.slug}`;
    }

    const cardProject: BridgeProject = {
      name: project.name,
      slug: project.slug,
      city: project.city,
      neighborhood: project.neighborhood,
      developer_name: project.developer_name,
      starting_price: project.starting_price,
      price_range: project.price_range,
      deposit_structure: project.deposit_structure,
      completion_year: project.completion_year,
      featured_image: project.featured_image,
      short_description: project.short_description,
      highlights: project.highlights,
      project_url: `${SITE_BASE}/properties/${project.slug}`,
      pricing_sheet_url: assets.includes("pricing") && Array.isArray(project.pricing_sheets) ? project.pricing_sheets[0] ?? null : null,
      floorplan_url: assets.includes("floorplan") && Array.isArray(project.floorplan_files) ? project.floorplan_files[0] ?? null : null,
      brochure_url: assets.includes("brochure") && Array.isArray(project.brochure_files) ? project.brochure_files[0] ?? null : null,
      pitch_deck_url,
    };

    const recipientName = (recipient?.name || "").trim();
    const greeting = recipientName ? `Hi ${recipientName.split(" ")[0]},` : "Hi there,";

    const intro = (custom_intro || `I wanted to share <strong>${escapeHtml(project.name)}</strong> with you — I think it lines up well with what you're looking for. Quick highlights and the latest materials below.`).trim();

    const bodyHtml = `
<div style="font:15px/1.6 'Plus Jakarta Sans','DM Sans',Helvetica,Arial,sans-serif;color:#111">
  <p style="margin:0 0 18px">${escapeHtml(greeting)}</p>
  <p style="margin:0 0 22px">${intro}</p>
</div>
${renderProjectCardHtml(cardProject)}
<div style="font:15px/1.6 'Plus Jakarta Sans','DM Sans',Helvetica,Arial,sans-serif;color:#111;margin-top:24px">
  <p style="margin:0">Happy to walk you through pricing, deposit structure, or set up a private appointment — just reply to this email or give me a call.</p>
</div>
`.trim();

    const subject = subject_override?.trim()
      || `${project.name}${project.neighborhood ? " — " + project.neighborhood : ""} · pricing & floor plans`;

    const html = renderEmailDocument({
      preheader: preheader || project.short_description || `${project.name} — pricing, floor plans, and the latest from Presale Properties.`,
      bodyHtml,
      agent,
    });

    return bridgeJson({
      subject,
      html,
      agent: { ...agent, signature_html: renderAgentSignatureHtml(agent) },
      project: cardProject,
    });
  } catch (e) {
    console.error("[bridge-render-email]", e);
    return bridgeJson({ error: e instanceof Error ? e.message : "Internal error" }, 500);
  }
});

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
