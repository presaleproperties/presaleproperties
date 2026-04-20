/**
 * GTM dataLayer helper — standardized lead/click events.
 *
 * Pushes a typed `lead_submit` event (or click events) to window.dataLayer
 * so GTM can fan out to GA4, Meta Pixel, Google Ads, and TikTok Pixel.
 *
 * Important: only call AFTER a successful Supabase insert.
 *
 * Re-exported alongside the existing `src/lib/tracking/` folder via
 * separate paths — this file is the GTM-specific helper.
 */

export type LeadType = "vip_signup" | "project_inquiry" | "calculator_report";
export type Persona = "first_time_buyer" | "investor" | "upsizer" | "realtor";
export type BudgetRange = "<500k" | "500_750k" | "750k_1m" | "1m+";

export interface LeadEvent {
  event: "lead_submit";
  lead_type: LeadType;
  project_slug?: string;
  project_name?: string;
  persona?: Persona;
  budget_range?: BudgetRange;
  cities?: string[];
  lead_source?: string;
  eventID: string;
  value: number;
  currency: "CAD";
  email_hash?: string;
  phone_hash?: string;
}

export interface ClickEvent {
  event: "phone_click" | "whatsapp_click";
  href: string;
  link_text?: string;
  page_path: string;
  eventID: string;
}

const VALUE_BY_TYPE: Record<LeadType, number> = {
  vip_signup: 25,
  project_inquiry: 100,
  calculator_report: 50,
};

function ensureDataLayer(): any[] | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { dataLayer?: any[] };
  w.dataLayer = w.dataLayer || [];
  return w.dataLayer;
}

function uuidv4(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback (should not be needed in modern browsers)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function sha256Hex(input: string): Promise<string | undefined> {
  if (typeof crypto === "undefined" || !crypto.subtle) return undefined;
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function normalizeEmail(email?: string | null): string | null {
  if (!email) return null;
  const v = email.trim().toLowerCase();
  return v.length ? v : null;
}

function normalizePhoneE164(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  // North American default — prepend +1 for 10-digit numbers
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

export interface PushLeadInput {
  lead_type: LeadType;
  project_slug?: string;
  project_name?: string;
  persona?: Persona;
  budget_range?: BudgetRange;
  cities?: string[];
  lead_source?: string;
  email?: string;
  phone?: string;
  /** Override default value mapping if provided. */
  value?: number;
}

/**
 * Push a standardized lead_submit event to dataLayer.
 * Hashes PII via Web Crypto. Returns the eventID used (for CAPI dedup).
 */
export async function pushLeadEvent(input: PushLeadInput): Promise<string> {
  const dl = ensureDataLayer();
  const eventID = uuidv4();

  const [email_hash, phone_hash] = await Promise.all([
    normalizeEmail(input.email) ? sha256Hex(normalizeEmail(input.email)!) : Promise.resolve(undefined),
    normalizePhoneE164(input.phone) ? sha256Hex(normalizePhoneE164(input.phone)!) : Promise.resolve(undefined),
  ]);

  const payload: LeadEvent = {
    event: "lead_submit",
    lead_type: input.lead_type,
    project_slug: input.project_slug,
    project_name: input.project_name,
    persona: input.persona,
    budget_range: input.budget_range,
    cities: input.cities,
    lead_source: input.lead_source,
    eventID,
    value: input.value ?? VALUE_BY_TYPE[input.lead_type],
    currency: "CAD",
    email_hash,
    phone_hash,
  };

  // Strip undefined keys for cleaner GTM debugging
  Object.keys(payload).forEach((k) => {
    if ((payload as Record<string, unknown>)[k] === undefined) {
      delete (payload as Record<string, unknown>)[k];
    }
  });

  dl?.push(payload);
  return eventID;
}

/**
 * Push a phone_click or whatsapp_click event. Used by the global
 * click-delegation listener in <ContactClickTracker />.
 */
export function pushClickEvent(
  type: "phone_click" | "whatsapp_click",
  href: string,
  linkText?: string,
): void {
  const dl = ensureDataLayer();
  if (!dl) return;
  const payload: ClickEvent = {
    event: type,
    href,
    link_text: linkText,
    page_path: typeof window !== "undefined" ? window.location.pathname : "",
    eventID: uuidv4(),
  };
  dl.push(payload);
}
