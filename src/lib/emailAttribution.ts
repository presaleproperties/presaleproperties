/**
 * Email Click Attribution
 * ─────────────────────────────────────────────────────────────────────────────
 * Captures email-click context from URL params written by the
 * `track-email-open` edge function (after redirect) and persists it in
 * sessionStorage so any lead form on the resulting session can attribute the
 * submission back to:
 *   • the specific email send (email_log_id, tracking_id)
 *   • the specific card / CTA / slot the user clicked
 *   • the project that was clicked (id, slug, category, city, neighborhood)
 *
 * URL params (set by track-email-open redirect):
 *   em_log     email_logs.id            → which email send
 *   em_tid     email_logs.tracking_id   → per-recipient token
 *   em_pid     project_id               → clicked project
 *   em_pslug   project_slug             → clicked project
 *   em_slot    card slot                → which card in the grid
 *   em_cta     cta name (e.g. card_button, card_image, card_title, nav, …)
 *   em_section section name (e.g. project_grid, header, explore_more)
 *   em_cat     category (condo / townhome / detached)
 *   em_city    city
 *   em_nbhd    neighborhood
 *
 * Stored under sessionStorage["email_attribution"] as JSON with a
 * `captured_at` ISO timestamp. Reset when the user opens a new browser tab
 * directly (no email link), so it never leaks across unrelated sessions.
 */
 
const STORAGE_KEY = "email_attribution";

export interface EmailAttribution {
  email_log_id?: string;
  tracking_id?: string;
  project_id?: string;
  project_slug?: string;
  slot?: number;
  cta?: string;
  section?: string;
  category?: string;
  city?: string;
  neighborhood?: string;
  /** ISO timestamp of when the click landed. */
  captured_at: string;
  /** Original landing URL (for debugging). */
  landing_url?: string;
}

const PARAM_KEYS = [
  "em_log",
  "em_tid",
  "em_pid",
  "em_pslug",
  "em_slot",
  "em_cta",
  "em_section",
  "em_cat",
  "em_city",
  "em_nbhd",
] as const;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined";
}

/**
 * Parse `em_*` query params into a structured EmailAttribution object.
 * Returns null if no email-attribution params are present.
 */
function parseFromSearch(search: string): EmailAttribution | null {
  const params = new URLSearchParams(search);
  const has = PARAM_KEYS.some((k) => params.has(k));
  if (!has) return null;

  const slotRaw = params.get("em_slot");
  const slotNum = slotRaw ? Number(slotRaw) : NaN;

  return {
    email_log_id: params.get("em_log") || undefined,
    tracking_id: params.get("em_tid") || undefined,
    project_id: params.get("em_pid") || undefined,
    project_slug: params.get("em_pslug") || undefined,
    slot: Number.isFinite(slotNum) ? slotNum : undefined,
    cta: params.get("em_cta") || undefined,
    section: params.get("em_section") || undefined,
    category: params.get("em_cat") || undefined,
    city: params.get("em_city") || undefined,
    neighborhood: params.get("em_nbhd") || undefined,
    captured_at: new Date().toISOString(),
    landing_url:
      typeof window !== "undefined" ? window.location.href : undefined,
  };
}

/**
 * Strip the `em_*` params from the URL (replaceState — no reload, no history
 * entry). Keeps the URL clean so users sharing the link don't accidentally
 * re-attribute someone else's session.
 */
function stripParamsFromUrl(): void {
  if (!isBrowser()) return;
  try {
    const url = new URL(window.location.href);
    let changed = false;
    for (const k of PARAM_KEYS) {
      if (url.searchParams.has(k)) {
        url.searchParams.delete(k);
        changed = true;
      }
    }
    if (changed) {
      const newSearch = url.searchParams.toString();
      const newUrl =
        url.pathname + (newSearch ? `?${newSearch}` : "") + url.hash;
      window.history.replaceState({}, document.title, newUrl);
    }
  } catch {
    /* ignore */
  }
}

/**
 * Capture email attribution from the current URL into sessionStorage.
 * Safe to call on every route change — only writes when params are present.
 * Returns the parsed attribution if one was captured this call.
 */
export function captureEmailAttributionFromUrl(): EmailAttribution | null {
  if (!isBrowser()) return null;
  const captured = parseFromSearch(window.location.search);
  if (!captured) return null;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(captured));
  } catch {
    /* sessionStorage may be unavailable (private mode) — silently skip */
  }
  stripParamsFromUrl();
  return captured;
}

/**
 * Read the persisted email attribution for the current session, if any.
 */
export function getEmailAttribution(): EmailAttribution | null {
  if (!isBrowser()) return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as EmailAttribution;
  } catch {
    return null;
  }
}

/** Wipe the captured attribution (e.g. after a successful lead submit). */
export function clearEmailAttribution(): void {
  if (!isBrowser()) return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
