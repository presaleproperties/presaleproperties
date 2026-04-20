/**
 * Helpers for reading Facebook tracking cookies + user-agent at form submit.
 * These values are needed for Meta Conversions API (CAPI) deduplication
 * with the browser pixel.
 *
 * SSR-safe: returns undefined when window/document are not available.
 */

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

export interface FbCookies {
  fbp?: string;
  fbc?: string;
}

/** Read _fbp and _fbc cookies set by the Meta Pixel. */
export function getFbCookies(): FbCookies {
  return {
    fbp: readCookie("_fbp"),
    fbc: readCookie("_fbc"),
  };
}

/** Browser user-agent, or undefined in SSR contexts. */
export function getClientUserAgent(): string | undefined {
  if (typeof navigator === "undefined") return undefined;
  return navigator.userAgent || undefined;
}

/**
 * Convenience bundle of all client-side tracking signals captured at
 * form submit time, used to enrich Supabase + Meta CAPI payloads.
 */
export interface ClientTrackingSnapshot {
  fbp?: string;
  fbc?: string;
  user_agent?: string;
}

export function getClientTrackingSnapshot(): ClientTrackingSnapshot {
  const { fbp, fbc } = getFbCookies();
  return {
    fbp,
    fbc,
    user_agent: getClientUserAgent(),
  };
}
