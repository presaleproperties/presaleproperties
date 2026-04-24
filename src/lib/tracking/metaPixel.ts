/**
 * Meta Pixel + Conversions API helpers
 *
 * Captures fbc/fbp cookies, generates dedup event_ids, and dual-sends
 * events to both the browser Pixel AND server-side CAPI for maximum
 * delivery (bypasses iOS 14+ tracking restrictions and ad-blockers).
 *
 * Critical for Facebook ad optimization:
 * - event_id matching enables dedup between Pixel + CAPI
 * - fbc / fbp enable click attribution
 * - value + currency enable bid optimization on Lead events
 */

import { safeTrackingInvoke } from "./safeInvoke";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FbqFunction = (...args: any[]) => void;

const DEBUG = import.meta.env.DEV;

// ---------- Cookie helpers ----------

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : undefined;
}

function setCookie(name: string, value: string, days = 90) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

/**
 * Capture fbclid from URL → set _fbc cookie in Meta's required format
 * Format: fb.1.<timestamp>.<fbclid>
 * Call once on app init.
 */
export function captureFbClickId(): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const fbclid = params.get("fbclid");
  if (!fbclid) return;

  // Don't overwrite existing _fbc unless fbclid changed
  const existing = getCookie("_fbc");
  const formatted = `fb.1.${Date.now()}.${fbclid}`;
  if (existing && existing.endsWith(`.${fbclid}`)) return;
  setCookie("_fbc", formatted, 90);
}

export function getFbc(): string | undefined {
  return getCookie("_fbc");
}

export function getFbp(): string | undefined {
  return getCookie("_fbp");
}

// ---------- Event ID generation ----------

export function generateEventId(): string {
  // Crypto-quality random + timestamp for uniqueness across pixel + capi
  const rand =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `${Date.now()}-${rand}`;
}

// ---------- Dual-send: Pixel + CAPI ----------

export interface MetaUserData {
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
}

export interface MetaCustomData {
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  content_type?: string;
  value?: number;
  currency?: string;
  num_items?: number;
  search_string?: string;
  // Custom params for audiences
  city?: string;
  persona?: string;
  intent_score?: number;
  [key: string]: unknown;
}

export interface DualSendOptions {
  eventName: string;
  userData?: MetaUserData;
  customData?: MetaCustomData;
  /** If true, send standard event (track). If false, sends trackCustom. Default true. */
  standard?: boolean;
}

/**
 * Fire a Meta event to both the browser Pixel AND the server-side CAPI
 * with a shared event_id for deduplication.
 */
export async function trackMetaDual(opts: DualSendOptions): Promise<void> {
  const { eventName, userData, customData, standard = true } = opts;
  const eventId = generateEventId();

  // 1. Browser Pixel
  try {
    const w = window as unknown as { fbq?: FbqFunction };
    if (w.fbq) {
      const params = { ...customData };
      const method = standard ? "track" : "trackCustom";
      w.fbq(method, eventName, params, { eventID: eventId });
      if (DEBUG) console.log(`📘 [Meta Pixel] ${eventName}`, { eventId, params });
    }
  } catch (err) {
    if (DEBUG) console.warn("Meta Pixel send failed", err);
  }

  // 2. Server-side CAPI (fire-and-forget). Transport errors are swallowed
  //    inside safeTrackingInvoke; the browser Pixel above is still the
  //    primary delivery path so analytics keep working either way.
  await safeTrackingInvoke("meta-conversions-api", {
    event_name: eventName,
    event_id: eventId,
    event_source_url: window.location.href,
    email: userData?.email,
    phone: userData?.phone,
    first_name: userData?.first_name,
    last_name: userData?.last_name,
    fbc: getFbc(),
    fbp: getFbp(),
    client_user_agent: navigator.userAgent,
    custom_data: customData,
  });
}

// ---------- High-level event helpers ----------

export const Meta = {
  /** Property/project detail view */
  viewContent: (data: {
    content_name: string;
    content_ids?: string[];
    value?: number;
    city?: string;
    content_category?: string;
  }) =>
    trackMetaDual({
      eventName: "ViewContent",
      customData: { content_type: "property", currency: "CAD", ...data },
    }),

  /** Search / filter use */
  search: (data: { search_string: string; city?: string; num_items?: number }) =>
    trackMetaDual({
      eventName: "Search",
      customData: data,
    }),

  /** Form submission (uses ad-bid-optimization value) */
  lead: (
    user: MetaUserData,
    data?: {
      content_name?: string;
      content_category?: string;
      value?: number;
      city?: string;
      persona?: string;
      intent_score?: number;
    }
  ) =>
    trackMetaDual({
      eventName: "Lead",
      userData: user,
      customData: { currency: "CAD", value: data?.value ?? 50, ...data },
    }),

  /** Tour / showing booked */
  schedule: (
    user: MetaUserData,
    data?: { content_name?: string; content_category?: string; value?: number }
  ) =>
    trackMetaDual({
      eventName: "Schedule",
      userData: user,
      customData: { currency: "CAD", value: data?.value ?? 250, ...data },
    }),

  /** Phone-verified deck unlock — high intent */
  completeRegistration: (user: MetaUserData, data?: { content_name?: string }) =>
    trackMetaDual({
      eventName: "CompleteRegistration",
      userData: user,
      customData: { currency: "CAD", value: 100, ...data },
    }),

  /** Form initiation */
  initiateCheckout: (data: { content_name: string; content_category?: string }) =>
    trackMetaDual({
      eventName: "InitiateCheckout",
      customData: data,
    }),

  /** Saved/favourited a project */
  addToWishlist: (data: { content_name: string; content_ids?: string[]; value?: number }) =>
    trackMetaDual({
      eventName: "AddToWishlist",
      customData: { content_type: "property", currency: "CAD", ...data },
    }),

  /** Generic contact event */
  contact: (user: MetaUserData, data?: { content_name?: string }) =>
    trackMetaDual({ eventName: "Contact", userData: user, customData: data }),
};

// ---------- Custom (non-standard) events ----------

export const MetaCustom = {
  floorplanDownload: (data: { project_name: string; project_id?: string }) =>
    trackMetaDual({ eventName: "FloorplanDownload", customData: data, standard: false }),

  deckUnlock: (user: MetaUserData, data: { project_name: string; project_id?: string }) =>
    trackMetaDual({
      eventName: "DeckUnlock",
      userData: user,
      customData: { ...data, currency: "CAD", value: 150 },
      standard: false,
    }),

  calculatorComplete: (data: { calculator_type: string; value?: number }) =>
    trackMetaDual({
      eventName: "CalculatorComplete",
      customData: { currency: "CAD", ...data },
      standard: false,
    }),

  highIntent: (data: { signal_type: string; project_name?: string; intent_score?: number }) =>
    trackMetaDual({ eventName: "HighIntent", customData: data, standard: false }),
};
