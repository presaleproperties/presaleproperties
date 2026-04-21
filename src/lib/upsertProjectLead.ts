import { supabase } from "@/integrations/supabase/client";
import { postToDealsFlow } from "@/lib/postToDealsFlow";
import { z } from "zod";

/**
 * Server-shape validation applied to every upsert. Form-level zod still
 * provides UX errors; this is the last-mile guard so direct callers, edge
 * functions, and refactors can never insert malformed/empty leads.
 */
const leadShape = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  name: z.string().trim().min(1).max(120).optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  message: z.string().trim().max(4000).optional().nullable(),
  form_type: z.string().trim().min(1).max(60),
  lead_source: z.string().trim().min(1).max(80),
});

/**
 * Upsert a project lead — if a lead with the same email already exists,
 * merge the new source into lead_sources and update fields. Otherwise insert.
 * Returns the lead ID (existing or new).
 *
 * Throws on:
 *   - missing/invalid email
 *   - missing form_type or lead_source (every public form path must tag itself)
 *   - oversized payload fields
 */
export async function upsertProjectLead(
  leadData: Record<string, any>
): Promise<string> {
  // Validate the minimum required shape. Throws with a readable error if any
  // form path forgets form_type/lead_source or sends a malformed email.
  const parsed = leadShape.safeParse({
    email: leadData.email,
    name: leadData.name,
    phone: leadData.phone,
    message: leadData.message,
    form_type: leadData.form_type,
    lead_source: leadData.lead_source,
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(
      `Invalid lead payload (${issue.path.join(".") || "lead"}): ${issue.message}`
    );
  }

  const email = parsed.data.email;
  const cleanName = parsed.data.name || null;
  const cleanPhone = parsed.data.phone || null;
  const cleanMessage = parsed.data.message || null;
  const formType = parsed.data.form_type;
  const leadSource = parsed.data.lead_source;

  // Check for existing lead by email
  const { data: existing } = await (supabase as any)
    .from("project_leads")
    .select("id, lead_sources, lead_source, message, intent_score")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1);

  if (existing && existing.length > 0) {
    const lead = existing[0];
    const existingSources: string[] = lead.lead_sources || [];
    const mergedSources = new Set(existingSources);
    mergedSources.add(leadSource);
    if (lead.lead_source) mergedSources.add(lead.lead_source);

    // Append message if new one provided
    const mergedMessage =
      lead.message && cleanMessage
        ? `${lead.message}\n---\n${cleanMessage}`
        : cleanMessage || lead.message || "";

    // Keep higher intent score
    const bestIntent = Math.max(lead.intent_score || 0, leadData.intent_score || 0);

    const updatePayload: Record<string, any> = {
      lead_sources: Array.from(mergedSources),
      message: mergedMessage,
      intent_score: bestIntent || undefined,
      lead_source: leadSource,
      form_type: formType,
    };

    // Update name/phone if provided
    if (cleanName) updatePayload.name = cleanName;
    if (cleanPhone) updatePayload.phone = cleanPhone;
    if (leadData.project_id) updatePayload.project_id = leadData.project_id;
    if (leadData.persona) updatePayload.persona = leadData.persona;
    if (leadData.visitor_id) updatePayload.visitor_id = leadData.visitor_id;
    if (leadData.session_id) updatePayload.session_id = leadData.session_id;
    if (leadData.utm_source) updatePayload.utm_source = leadData.utm_source;
    if (leadData.utm_medium) updatePayload.utm_medium = leadData.utm_medium;
    if (leadData.utm_campaign) updatePayload.utm_campaign = leadData.utm_campaign;
    if (leadData.utm_content) updatePayload.utm_content = leadData.utm_content;
    if (leadData.utm_term) updatePayload.utm_term = leadData.utm_term;
    if (leadData.referrer) updatePayload.referrer = leadData.referrer;
    if (leadData.landing_page) updatePayload.landing_page = leadData.landing_page;

    await (supabase as any)
      .from("project_leads")
      .update(updatePayload)
      .eq("id", lead.id);

    // Fire-and-forget to DealsFlow CRM
    postToDealsFlow({
      name: cleanName ?? "",
      email,
      phone: cleanPhone ?? "",
      project: leadData.project_name || "",
      source: leadSource,
      buyer_type: leadData.persona || "",
    });

    return lead.id;
  }

  // New lead — insert
  const newId = leadData.id || crypto.randomUUID();
  const insertPayload = {
    ...leadData,
    id: newId,
    email,
    name: cleanName,
    phone: cleanPhone,
    message: cleanMessage,
    form_type: formType,
    lead_source: leadSource,
    lead_sources: [leadSource],
  };

  const { error } = await (supabase as any)
    .from("project_leads")
    .insert(insertPayload);

  if (error) throw error;

  // Fire-and-forget to DealsFlow CRM
  postToDealsFlow({
    name: cleanName ?? "",
    email,
    phone: cleanPhone ?? "",
    project: leadData.project_name || "",
    source: leadSource,
    buyer_type: leadData.persona || "",
  });

  return newId;
}
