/**
 * Fire-and-forget fan-out to the DealzFlow CRM bridge for forms / events
 * that don't already flow through `upsertProjectLead` or `track-client-activity`.
 *
 * Calls the existing `push-activity-to-crm` edge function, which forwards to
 * the CRM's `bridge-ingest-lead` with the BRIDGE_SECRET attached server-side.
 *
 * Never throws — failures are silently swallowed so the user experience is
 * unaffected.
 */

import { supabase } from "@/integrations/supabase/client";
import { setKnownEmail } from "@/lib/tracking/streamBehavior";
import {
  buildCanonicalEvent,
  eventToCrmBridgeBody,
  type CanonicalEventName,
} from "@/lib/contracts/leadContract";

export interface NotifyCrmInput {
  /** Canonical event type, e.g. 'newsletter_subscribe', 'appointment_booked',
   *  'agent_waitlist', 'vip_registration', 'favorite_add', 'search_saved',
   *  'alert_subscribed', 'off_market_access_request', 'off_market_inquiry',
   *  'return_visit'. */
  event_type: string;
  /** Lowercased email when known — required for CRM stitching. */
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  /** Source tag: 'presale_properties_<area>'. */
  source?: string;
  /** Event-specific payload merged into the CRM behavior block. */
  payload?: Record<string, unknown>;
}

export function notifyCrm(input: NotifyCrmInput): void {
  try {
    if (input.email) setKnownEmail(input.email);
    const evt = buildCanonicalEvent({
      event_name: input.event_type as CanonicalEventName,
      identity: {
        email: input.email ?? undefined,
        first_name: input.first_name ?? undefined,
        last_name: input.last_name ?? undefined,
        phone: input.phone ?? undefined,
      },
      payload: input.payload,
    });
    const body = eventToCrmBridgeBody(evt);
    if (input.source) body.source = input.source;
    supabase.functions
      .invoke("push-activity-to-crm", { body })
      .catch(() => { /* swallow */ });
  } catch {
    /* ignore */
  }
}
