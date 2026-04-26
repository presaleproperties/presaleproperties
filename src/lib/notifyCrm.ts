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
    supabase.functions
      .invoke("push-activity-to-crm", {
        body: {
          event_type: input.event_type,
          visitor_id: getVisitorId(),
          session_id: getSessionId(),
          email: input.email ? String(input.email).trim().toLowerCase() : undefined,
          first_name: input.first_name ?? undefined,
          last_name: input.last_name ?? undefined,
          phone: input.phone ?? undefined,
          source: input.source ?? "presale_properties",
          payload: {
            ...(input.payload ?? {}),
            page_url: typeof window !== "undefined" ? window.location.href : undefined,
            page_path: typeof window !== "undefined" ? window.location.pathname : undefined,
          },
        },
      })
      .catch(() => {
        /* swallow */
      });
  } catch {
    /* ignore */
  }
}
