/**
 * Stream behavior to the CRM via the durable outbox.
 *
 * Phase A: every behavior batch is enqueued into `crm_outbox` first
 * (transactional, retry-backed) instead of fire-and-forget invoking
 * `bridge-stream-behavior` directly. The cron-scheduled drain worker
 * guarantees delivery even if the CRM bridge is briefly down.
 *
 * Two exceptions still bypass the outbox by design:
 *   - `beacon: true` flushes on `beforeunload` use `navigator.sendBeacon`
 *     because the page is unloading and we cannot await an RPC round-trip.
 *     These are best-effort and acceptable to lose (next page load will
 *     stream the resumed buffer through the outbox).
 *
 * Never throws.
 */

import { supabase } from "@/integrations/supabase/client";
import {
  buildBehaviorPayload,
  getPresaleUserId,
} from "./behaviorBuffer";
import { enqueueCanonicalEvent } from "@/lib/crm/outbox";

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
const ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

let lastSentAt = 0;
const MIN_INTERVAL_MS = 1500; // throttle bursts

function getKnownEmail(): string | undefined {
  try {
    const raw =
      sessionStorage.getItem("pp_known_email") ||
      localStorage.getItem("pp_known_email");
    return raw || undefined;
  } catch { return undefined; }
}

export function setKnownEmail(email: string | undefined | null): void {
  try {
    if (email) {
      const clean = String(email).trim().toLowerCase();
      sessionStorage.setItem("pp_known_email", clean);
      // Persist across sessions so the return-visit alert can fire on next visit
      localStorage.setItem("pp_known_email", clean);
    }
  } catch { /* ignore */ }
}

export interface StreamOptions {
  /** When true, bypass the throttle. Use for beforeunload flushes. */
  immediate?: boolean;
  /** Use sendBeacon (for unload). Bypasses the outbox by necessity. */
  beacon?: boolean;
}

export function streamBehavior(opts: StreamOptions = {}): void {
  if (typeof window === "undefined") return;
  const now = Date.now();
  if (!opts.immediate && now - lastSentAt < MIN_INTERVAL_MS) return;
  lastSentAt = now;

  const presale_user_id = getPresaleUserId();
  const email = getKnownEmail();
  const behavior = buildBehaviorPayload();

  // Unload path — must be synchronous, sendBeacon is the only option.
  // Acceptable loss: next page load streams the resumed buffer durably.
  if (opts.beacon && SUPABASE_URL && ANON_KEY && navigator.sendBeacon) {
    try {
      const url = `${SUPABASE_URL}/functions/v1/bridge-stream-behavior?apikey=${encodeURIComponent(ANON_KEY)}`;
      const blob = new Blob(
        [JSON.stringify({ presale_user_id, email, behavior })],
        { type: "application/json" }
      );
      navigator.sendBeacon(url, blob);
      return;
    } catch { /* fall through to outbox */ }
  }

  // Durable path — enqueue into crm_outbox (RPC), drain worker delivers.
  enqueueCanonicalEvent({
    event_name: "behavior_batch",
    identity: email ? { email } : undefined,
    payload: {
      presale_user_id,
      behavior,
      source: "presale_properties_web",
    },
  }).catch(() => { /* swallow — enqueue is already non-throwing */ });
}
