const DEALSFLOW_WEBHOOK =
  "https://cplycyfgywxhlecazvra.supabase.co/functions/v1/lead-webhook?source=website";

/**
 * Fire-and-forget POST to DealsFlow CRM.
 * Never throws — failures are silently swallowed so the user experience is unaffected.
 */
export function postToDealsFlow(lead: {
  name?: string;
  email?: string;
  phone?: string;
  project?: string;
  source?: string;
  buyer_type?: string;
}) {
  fetch(DEALSFLOW_WEBHOOK, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Webhook-Secret": "presale-leads-2026",
    },
    body: JSON.stringify({
      name: lead.name || "",
      email: lead.email || "",
      phone: lead.phone || "",
      project: lead.project || "",
      source: lead.source || "website",
      buyer_type: lead.buyer_type || "",
    }),
  }).catch(() => {}); // Silent fail
}
