/**
 * Stream behavior to the CRM (anonymous-friendly).
 *
 * Posts a {presale_user_id, email?, behavior} payload to the
 * `bridge-stream-behavior` edge function, which forwards it to the CRM's
 * `bridge-ingest-behavior` endpoint with the BRIDGE_SECRET attached
 * server-side (the secret can never be exposed in the browser).
 *
 * Fire-and-forget — never throws.
 */

import { supabase } from "@/integrations/supabase/client";
import {
  buildBehaviorPayload,
  getPresaleUserId,
} from "./behaviorBuffer";

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
  /** Use sendBeacon (for unload). */
  beacon?: boolean;
}

export function streamBehavior(opts: StreamOptions = {}): void {
  if (typeof window === "undefined") return;
  const now = Date.now();
  if (!opts.immediate && now - lastSentAt < MIN_INTERVAL_MS) return;
  lastSentAt = now;

  const payload = {
    presale_user_id: getPresaleUserId(),
    email: getKnownEmail(),
    behavior: buildBehaviorPayload(),
  };

  // Beacon path for unload — does not support custom headers beyond Content-Type
  if (opts.beacon && SUPABASE_URL && ANON_KEY && navigator.sendBeacon) {
    try {
      const url = `${SUPABASE_URL}/functions/v1/bridge-stream-behavior?apikey=${encodeURIComponent(ANON_KEY)}`;
      const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
      navigator.sendBeacon(url, blob);
      return;
    } catch { /* fall through */ }
  }

  // Normal path
  supabase.functions
    .invoke("bridge-stream-behavior", { body: payload })
    .catch(() => { /* swallow */ });
}
