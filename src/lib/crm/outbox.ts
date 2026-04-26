/**
 * Outbox writer — every CRM-bound message goes here first.
 *
 * Two-phase delivery:
 *   1. Synchronously INSERT into `crm_outbox` (durable, transactional).
 *   2. Fire-and-forget kick the drain function so the message goes out
 *      within seconds in the happy path.
 *
 * If step 2 fails (CRM down, network hiccup), the cron-scheduled
 * `drain-crm-outbox` worker picks it up within ~60 s.
 *
 * NEVER throws. Failures are logged in dev only.
 */

import { supabase } from "@/integrations/supabase/client";
import {
  buildCanonicalLead,
  buildCanonicalEvent,
  leadToCrmBridgeBody,
  eventToCrmBridgeBody,
  type BuildLeadInput,
  type BuildEventInput,
} from "@/lib/contracts/leadContract";

const DEBUG = (import.meta as any).env?.DEV;

async function enqueue(args: {
  kind: "lead" | "event" | "identity" | "conversion";
  endpoint: string;
  payload: Record<string, unknown>;
  email?: string;
  presale_user_id?: string;
  event_id?: string;
}): Promise<void> {
  try {
    const { error } = await (supabase as any).rpc("enqueue_crm_outbox", {
      p_kind: args.kind,
      p_endpoint: args.endpoint,
      p_payload: args.payload,
      p_email: args.email ?? null,
      p_presale_user_id: args.presale_user_id ?? null,
      p_event_id: args.event_id ?? null,
    });
    if (error) {
      if (DEBUG) console.warn("[outbox] enqueue failed", error);
      return;
    }
    // Best-effort drain kick. Cron will catch anything we miss.
    supabase.functions.invoke("drain-crm-outbox", { body: {} }).catch(() => {});
  } catch (err) {
    if (DEBUG) console.warn("[outbox] enqueue threw", err);
  }
}

/** Enqueue a canonical lead submission. */
export async function enqueueCanonicalLead(input: BuildLeadInput): Promise<void> {
  const lead = buildCanonicalLead(input);
  const body = leadToCrmBridgeBody(lead);
  await enqueue({
    kind: "lead",
    endpoint: "push-lead-to-crm",
    payload: { lead: body },
    email: lead.identity.email,
    presale_user_id: lead.context.presale_user_id,
    event_id: lead.context.event_id,
  });
}

/** Enqueue a canonical behavior event. */
export async function enqueueCanonicalEvent(input: BuildEventInput): Promise<void> {
  const evt = buildCanonicalEvent(input);
  const body = eventToCrmBridgeBody(evt);
  await enqueue({
    kind: "event",
    endpoint: "push-activity-to-crm",
    payload: body,
    email: evt.identity?.email,
    presale_user_id: evt.context.presale_user_id,
    event_id: evt.context.event_id,
  });
}

/** Enqueue an identity-stitch hint (anonymous → known). */
export async function enqueueIdentityStitch(args: {
  email?: string;
  phone?: string;
  presale_user_id: string;
  source: string;
}): Promise<void> {
  await enqueue({
    kind: "identity",
    endpoint: "bridge-stitch-identities",
    payload: { hint: args },
    email: args.email,
    presale_user_id: args.presale_user_id,
  });
}
