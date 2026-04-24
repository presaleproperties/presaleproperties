/**
 * Behavior Buffer
 * 
 * Client-side buffer of session metadata, property views, and form events.
 * Backed by sessionStorage so it survives navigation but resets per browser
 * session. Used for two purposes:
 *  1. Bundled into the lead payload at signup (sent via push-lead-to-crm).
 *  2. Streamed live (anonymous) to the CRM via bridge-stream-behavior.
 * 
 * The presale_user_id is the existing visitor_id (pp_vid) — stable across
 * sessions and reused after signup so the CRM can stitch anonymous activity
 * to the contact.
 */

import { getVisitorId, getSessionId } from "./identifiers";

const SESSION_META_KEY = "pp_bh_session";
const VIEWS_KEY = "pp_bh_views";
const FORMS_KEY = "pp_bh_forms";

export interface SessionMeta {
  session_id: string;
  pages_viewed: number;
  landing_page: string;
  exit_page: string;
  referrer: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  device_type: "mobile" | "tablet" | "desktop";
  started_at: string; // ISO
  ended_at: string;   // ISO (updated continuously)
}

export interface PropertyViewEntry {
  property_id?: string;
  property_name?: string;
  property_url: string;
  action: "view" | "favorite" | "share";
  viewed_at: string;
}

export interface FormEntry {
  form_type: string;
  funnel_step?: number;
  funnel_total_steps?: number;
  status?: "started" | "abandoned" | "completed";
  submitted_at: string;
}

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeWrite(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

function detectDevice(): "mobile" | "tablet" | "desktop" {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return "tablet";
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) return "mobile";
  return "desktop";
}

function readUtm(): { utm_source: string | null; utm_medium: string | null; utm_campaign: string | null } {
  if (typeof window === "undefined") return { utm_source: null, utm_medium: null, utm_campaign: null };
  const params = new URLSearchParams(window.location.search);
  const ss = (k: string) => { try { return sessionStorage.getItem(k); } catch { return null; } };
  return {
    utm_source: params.get("utm_source") || ss("utm_source"),
    utm_medium: params.get("utm_medium") || ss("utm_medium"),
    utm_campaign: params.get("utm_campaign") || ss("utm_campaign"),
  };
}

/** Get (or initialize) the current session metadata. */
export function getSessionMeta(): SessionMeta {
  const existing = safeRead<SessionMeta | null>(SESSION_META_KEY, null);
  const now = new Date().toISOString();
  if (existing && existing.session_id === getSessionId()) {
    existing.ended_at = now;
    existing.exit_page = typeof window !== "undefined" ? window.location.href : existing.exit_page;
    safeWrite(SESSION_META_KEY, existing);
    return existing;
  }
  const utm = readUtm();
  const fresh: SessionMeta = {
    session_id: getSessionId(),
    pages_viewed: 0,
    landing_page: typeof window !== "undefined" ? window.location.href : "",
    exit_page: typeof window !== "undefined" ? window.location.href : "",
    referrer: typeof document !== "undefined" ? document.referrer : "",
    utm_source: utm.utm_source,
    utm_medium: utm.utm_medium,
    utm_campaign: utm.utm_campaign,
    device_type: detectDevice(),
    started_at: now,
    ended_at: now,
  };
  safeWrite(SESSION_META_KEY, fresh);
  return fresh;
}

/** Increment page-view counter and refresh exit page / ended_at. */
export function recordPageView(): SessionMeta {
  const meta = getSessionMeta();
  meta.pages_viewed = (meta.pages_viewed || 0) + 1;
  meta.exit_page = typeof window !== "undefined" ? window.location.href : meta.exit_page;
  meta.ended_at = new Date().toISOString();
  safeWrite(SESSION_META_KEY, meta);
  return meta;
}

/** Append (deduped by property_id+action) a property/card view. */
export function recordPropertyView(entry: Omit<PropertyViewEntry, "viewed_at"> & { viewed_at?: string }): void {
  const list = safeRead<PropertyViewEntry[]>(VIEWS_KEY, []);
  const viewed_at = entry.viewed_at ?? new Date().toISOString();
  // De-dupe: only one entry per (property_id|url, action) per session
  const key = (e: PropertyViewEntry) => `${e.property_id ?? e.property_url}::${e.action}`;
  const newEntry: PropertyViewEntry = { ...entry, viewed_at };
  const next = [...list.filter((e) => key(e) !== key(newEntry)), newEntry];
  // Cap to last 50 to keep payload bounded
  safeWrite(VIEWS_KEY, next.slice(-50));
}

export function recordFormEvent(entry: Omit<FormEntry, "submitted_at"> & { submitted_at?: string }): void {
  const list = safeRead<FormEntry[]>(FORMS_KEY, []);
  const submitted_at = entry.submitted_at ?? new Date().toISOString();
  list.push({ ...entry, submitted_at });
  safeWrite(FORMS_KEY, list.slice(-30));
}

export function getViews(): PropertyViewEntry[] { return safeRead<PropertyViewEntry[]>(VIEWS_KEY, []); }
export function getForms(): FormEntry[] { return safeRead<FormEntry[]>(FORMS_KEY, []); }

/** Derive an estimated session duration in seconds. */
export function getSessionDurationSeconds(): number {
  const meta = getSessionMeta();
  const start = new Date(meta.started_at).getTime();
  const end = new Date(meta.ended_at).getTime();
  return Math.max(0, Math.round((end - start) / 1000));
}

/** Build the full behavior payload (sessions/views/forms) ready for the CRM. */
export function buildBehaviorPayload() {
  const meta = getSessionMeta();
  const duration_seconds = getSessionDurationSeconds();
  return {
    sessions: [{
      session_id: meta.session_id,
      pages_viewed: meta.pages_viewed,
      duration_seconds,
      landing_page: meta.landing_page,
      exit_page: meta.exit_page,
      referrer: meta.referrer,
      utm_source: meta.utm_source,
      utm_medium: meta.utm_medium,
      utm_campaign: meta.utm_campaign,
      device_type: meta.device_type,
      started_at: meta.started_at,
      ended_at: new Date().toISOString(),
    }],
    views: getViews(),
    forms: getForms(),
  };
}

/** Stable presale_user_id — reuses the existing visitor_id so it persists across signup. */
export function getPresaleUserId(): string { return getVisitorId(); }
