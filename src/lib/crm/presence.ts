/**
 * Realtime presence channel — broadcasts visitor activity to a Supabase
 * Realtime channel that the CRM dashboard subscribes to.
 *
 * Sub-second delivery, automatic reconnection, no edge-function cold start.
 * Replaces the SMS-on-every-page hammer with a proper streaming feed
 * (the SMS notify-lead-return function still fires once for return-visit
 * alerts; this channel is for live "agent is watching" UX).
 */

import { supabase } from "@/integrations/supabase/client";
import { getPresaleUserId } from "@/lib/tracking/behaviorBuffer";
import { getCurrentPageContext } from "@/lib/crm/pageContext";

const CHANNEL_NAME = "crm:lead-activity";

let channel: ReturnType<typeof supabase.channel> | null = null;
let joined = false;

function getEmail(): string | undefined {
  try {
    return (
      sessionStorage.getItem("pp_known_email") ||
      localStorage.getItem("pp_known_email") ||
      undefined
    );
  } catch { return undefined; }
}

function ensureChannel() {
  if (channel) return channel;
  channel = supabase.channel(CHANNEL_NAME, {
    config: { broadcast: { ack: false, self: false } },
  });
  channel.subscribe((status) => {
    if (status === "SUBSCRIBED") joined = true;
  });
  return channel;
}

export type PresenceEventType =
  | "visitor_active"        // any page interaction (throttled)
  | "page_view"
  | "property_view"
  | "form_start"
  | "form_submit"
  | "deck_visit"
  | "return_visit";

export function broadcastPresence(
  event: PresenceEventType,
  payload: Record<string, unknown> = {}
): void {
  if (typeof window === "undefined") return;
  try {
    const ch = ensureChannel();
    if (!joined) {
      // Fire after subscribe completes
      setTimeout(() => broadcastPresence(event, payload), 250);
      return;
    }
    ch.send({
      type: "broadcast",
      event,
      payload: {
        ...payload,
        ...getCurrentPageContext(),
        presale_user_id: getPresaleUserId(),
        email: getEmail(),
        page_url: window.location.href,
        page_path: window.location.pathname,
        page_title: document.title,
        ts: new Date().toISOString(),
      },
    });
  } catch { /* ignore */ }
}

let lastActiveAt = 0;
export function broadcastVisitorActive(): void {
  const now = Date.now();
  if (now - lastActiveAt < 5000) return; // 5s throttle
  lastActiveAt = now;
  broadcastPresence("visitor_active");
}
