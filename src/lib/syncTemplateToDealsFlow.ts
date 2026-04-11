const TEMPLATE_SYNC_URL =
  "https://cplycyfgywxhlecazvra.supabase.co/functions/v1/template-sync";

const SYNC_HEADERS = {
  "Content-Type": "application/json",
  "x-webhook-secret": "presale-leads-2026",
};

/**
 * Fire-and-forget sync of a saved Marketing Hub template to DealsFlow CRM.
 * Pushes to crm_email_templates so the same template is usable in DealsFlow.
 * Never throws — failures are silently swallowed.
 */
export function syncTemplateToDealsFlow(template: {
  name: string;
  subject: string;
  html: string;
  project?: string;
  category?: string;
}) {
  fetch(TEMPLATE_SYNC_URL, {
    method: "POST",
    headers: SYNC_HEADERS,
    body: JSON.stringify({
      name: template.name,
      subject: template.subject,
      html_content: template.html,
      category: template.category || "custom",
      project_tags: template.project ? [template.project] : [],
      area_tags: [],
      source: "marketing_hub",
    }),
  }).catch(() => {}); // Silent fail
}
