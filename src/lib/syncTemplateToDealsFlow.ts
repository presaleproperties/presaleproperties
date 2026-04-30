import { supabase } from "@/integrations/supabase/client";

const TEMPLATE_SYNC_URL =
  "https://cplycyfgywxhlecazvra.supabase.co/functions/v1/template-sync";

const SYNC_HEADERS = {
  "Content-Type": "application/json",
  "x-webhook-secret": "presale-leads-2026",
};

export interface TemplateSyncPayload {
  /** Stable Presale slug — used for cross-system matching. Required. */
  external_id: string;
  name: string;
  subject: string;
  html: string;
  /** "agent:<slug>" or "team:presale" */
  owner_scope: string;
  /** null when team-scoped */
  owner_agent_slug: string | null;
  created_by_agent_slug?: string | null;
  project?: string;
  category?: string;
  merge_tags?: string[];
  sync_hash?: string;
  /** When true, CRM should set is_active=false. */
  deleted?: boolean;
}

/**
 * Fire-and-forget sync of a Marketing Hub template to DealsFlow CRM.
 * Pushes ownership scope so the CRM can apply per-agent visibility.
 * Never throws — failures are silently swallowed.
 */
export function syncTemplateToDealsFlow(template: TemplateSyncPayload) {
  fetch(TEMPLATE_SYNC_URL, {
    method: "POST",
    headers: SYNC_HEADERS,
    body: JSON.stringify({
      templates: [
        {
          external_id: template.external_id,
          name: template.name,
          subject: template.subject,
          html_content: template.html,
          body_html: template.html,
          owner_scope: template.owner_scope,
          owner_agent_slug: template.owner_agent_slug,
          created_by_agent_slug: template.created_by_agent_slug ?? null,
          category: template.category || "custom",
          project: template.project || null,
          project_tags: template.project ? [template.project] : [],
          merge_tags: template.merge_tags || [],
          sync_hash: template.sync_hash || null,
          deleted: template.deleted === true,
          source: "presale_properties",
        },
      ],
    }),
  }).catch(() => {});
}

/** Resolve the current signed-in user's Presale agent slug, if any. */
export async function getCurrentAgentSlug(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("team_members")
    .select("agent_slug")
    .eq("user_id", user.id)
    .maybeSingle();
  return data?.agent_slug ?? null;
}

/**
 * Notify DealsFlow CRM that a template was deleted.
 * Reads slug + scope from the row before delete so the CRM can match it.
 */
export async function syncTemplateDeletionToDealsFlow(templateId: string) {
  try {
    const { data } = await supabase
      .from("campaign_templates")
      .select("slug, owner_scope, owner_agent_slug, name")
      .eq("id", templateId)
      .maybeSingle();
    if (!data) return;
    syncTemplateToDealsFlow({
      external_id: (data as any).slug || templateId,
      name: (data as any).name || "deleted",
      subject: "",
      html: "",
      owner_scope: (data as any).owner_scope || "team:presale",
      owner_agent_slug: (data as any).owner_agent_slug || null,
      deleted: true,
    });
  } catch { /* swallow */ }
}
