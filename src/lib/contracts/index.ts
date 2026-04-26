/**
 * @presale/crm-contract — versioned shared contract between
 * presaleproperties.com (this site) and the DealzFlow CRM.
 *
 * Both sides import from this single module so any field rename or
 * enum addition is caught at compile time on both ends.
 *
 * To consume from the CRM project today (until we publish to a registry):
 *   - Copy this file to the CRM repo at the same path, OR
 *   - Use the cross-project copy tool to sync.
 *
 * Bump CONTRACT_VERSION on every breaking change. The CRM bridge ingest
 * functions should reject payloads from older incompatible versions.
 */

export const CONTRACT_VERSION = "1.0.0" as const;

export type {
  CanonicalContext,
  CanonicalIdentity,
  CanonicalLead,
  CanonicalEvent,
  CanonicalFormType,
  CanonicalLeadSource,
  CanonicalPersona,
  CanonicalEventName,
  BuildLeadInput,
  BuildEventInput,
} from "./leadContract";

export {
  buildContext,
  buildCanonicalLead,
  buildCanonicalEvent,
  leadToProjectLeadRow,
  leadToCrmBridgeBody,
  eventToCrmBridgeBody,
} from "./leadContract";

/**
 * Inbound webhook event types the CRM may POST to /crm-webhook-inbound
 * on the website. Keep in sync with supabase/functions/crm-webhook-inbound.
 */
export type CrmInboundEventType =
  | "contact.upsert"
  | "contact.stage_changed"
  | "contact.agent_assigned"
  | "contact.tags_changed"
  | "contact.merged"
  | "deal.won";

export interface CrmInboundEvent {
  type: CrmInboundEventType;
  /** At least one of these is required to find the contact. */
  email?: string;
  presale_user_id?: string;
  phone?: string;
  crm_contact_id?: string;
  /** Type-specific payload (lifecycle_stage, assigned_agent, tags, value, …). */
  data?: Record<string, unknown>;
}
