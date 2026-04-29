/**
 * ============================================================================
 *  CANONICAL LEAD + BEHAVIOR EVENT CONTRACT
 * ============================================================================
 *
 *  Single source of truth for every payload that leaves this site headed to:
 *    - The local Supabase tables (project_leads, vip_registrations, …)
 *    - The DealzFlow CRM bridge (push-lead-to-crm, push-activity-to-crm,
 *      bridge-stream-behavior)
 *    - The Meta CAPI / Pixel (event_id-deduped)
 *    - Zapier behavior webhook
 *
 *  RULES
 *  -----
 *  1. Every form / event must produce a `CanonicalLead` or `CanonicalEvent`
 *     by calling `buildCanonicalLead()` or `buildCanonicalEvent()`.
 *  2. Forms MUST NOT manually attach UTM, fbp/fbc, visitor_id, session_id,
 *     referrer, landing_page, or device_type — those are added automatically.
 *  3. Forms only supply the fields that the user actually entered + the
 *     `form_type` / `lead_source` tags.
 *
 *  ANY new form / event must extend the discriminated unions below — that is
 *  how the type system guarantees the contract stays canonical.
 * ============================================================================
 */

import {
  getVisitorId,
  getSessionId,
  generateEventId,
} from "@/lib/tracking/identifiers";
import {
  getAttributionData,
  getReferrer,
  type UtmParams,
} from "@/lib/tracking/attribution";
import { getFbp, getFbc } from "@/lib/tracking/metaPixel";
import { getPresaleUserId } from "@/lib/tracking/behaviorBuffer";

// ============================================================================
//  CONTEXT — auto-attached to every payload
// ============================================================================

export interface CanonicalContext {
  /** Stable cross-session visitor cookie. */
  visitor_id: string;
  /** Per-tab session id (rotates after 30min idle). */
  session_id: string;
  /** Anonymous-friendly id used by streamBehavior / CRM stitching. */
  presale_user_id: string;
  /** Unique id per event — used for Meta CAPI/Pixel dedup. */
  event_id: string;
  /** ISO timestamp the payload was built. */
  occurred_at: string;
  page: {
    url: string;
    path: string;
    title: string;
    referrer: string;
  };
  device: {
    user_agent: string;
    type: "mobile" | "tablet" | "desktop";
    language: string;
    timezone_offset: number;
    screen_width: number;
    screen_height: number;
  };
  attribution: {
    first_utm: UtmParams;
    last_utm: UtmParams;
    /** Original URL the user landed on (with query string). */
    landing_page?: string;
  };
  pixels: {
    /** Meta browser id (cookie `_fbp`). */
    fbp?: string;
    /** Meta click id (cookie `_fbc`). */
    fbc?: string;
    /** Google click id (most-recent). */
    gclid?: string;
    /** Meta click id raw param (most-recent). */
    fbclid?: string;
  };
}

// ============================================================================
//  IDENTITY — how we stitch a person across sessions / channels
// ============================================================================

export interface CanonicalIdentity {
  /** Lowercased, trimmed. Required for any form that submits an email. */
  email?: string;
  first_name?: string;
  last_name?: string;
  /** E.164-ish or formatted (XXX) XXX-XXXX. */
  phone?: string;
  /** Stable id from the public.profiles or vip_registrations table, when known. */
  user_id?: string;
}

// ============================================================================
//  FORM TYPES — every form on the site MUST appear here
// ============================================================================

export type CanonicalFormType =
  | "vip_registration"
  | "vip_pre_sale_access"
  | "newsletter_subscribe"
  | "project_inquiry"
  | "project_lead_general"
  | "appointment_booking"
  | "agent_waitlist"
  | "off_market_access_request"
  | "off_market_inquiry"
  | "buyer_consultation"
  | "general_contact"
  | "exit_intent_lead_magnet"
  | "pitch_deck_unlock"
  | "favorite_save"
  | "alert_subscribe";

export type CanonicalLeadSource =
  | "presale_properties_home_hero"
  | "presale_properties_home_vip"
  | "presale_properties_mobile_home"
  | "presale_properties_experts_section"
  | "presale_properties_agent_waitlist"
  | "presale_properties_booking_modal"
  | "presale_properties_about_contact"
  | "presale_properties_contact_page"
  | "presale_properties_project_detail"
  | "presale_properties_pitch_deck"
  | "presale_properties_off_market"
  | "presale_properties_exit_intent"
  | "presale_properties_newsletter"
  | "presale_properties_unknown";

export type CanonicalPersona = "buyer" | "investor" | "realtor" | "developer" | "unknown";

// ============================================================================
//  LEAD payload (form submission)
// ============================================================================

export interface CanonicalLead {
  /** Discriminator. */
  kind: "lead";
  /** Which form on the site produced this. */
  form_type: CanonicalFormType;
  /** Where the form physically lives — used for CRM source routing. */
  lead_source: CanonicalLeadSource;
  identity: CanonicalIdentity;
  /** Free-form message / notes the user typed. */
  message?: string;
  /** Optional buyer-intent classification. */
  persona?: CanonicalPersona;
  /** Numeric intent score (0-100). */
  intent_score?: number;
  /** Project context, when the form was attached to a specific project. */
  project?: {
    id?: string;
    name?: string;
    slug?: string;
  };
  /** Per-form extras (deposit budget, timeline, beds/baths…). */
  extras?: Record<string, unknown>;
  context: CanonicalContext;
}

// ============================================================================
//  BEHAVIOR EVENT payload
// ============================================================================

export type CanonicalEventName =
  | "page_view"
  | "property_view"
  | "search"
  | "floorplan_view"
  | "floorplan_download"
  | "favorite_add"
  | "favorite_remove"
  | "cta_click"
  | "form_start"
  | "form_submit"
  | "deck_visit"
  | "deck_section_view"
  | "return_visit"
  | "lead_back_on_site"
  | "behavior_batch";

export interface CanonicalEvent {
  kind: "event";
  event_name: CanonicalEventName;
  /** When known — required for CRM stitching beyond presale_user_id. */
  identity?: CanonicalIdentity;
  /** Event-specific payload. Stay flat — keep nested objects shallow. */
  payload: Record<string, unknown>;
  context: CanonicalContext;
}

// ============================================================================
//  BUILDERS — call these from forms / event tracking sites
// ============================================================================

function detectDeviceType(): "mobile" | "tablet" | "desktop" {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return "tablet";
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) return "mobile";
  return "desktop";
}

function safeStorage(key: string): string | undefined {
  try {
    return (
      sessionStorage.getItem(key) ||
      localStorage.getItem(key) ||
      undefined
    );
  } catch {
    return undefined;
  }
}

export function buildContext(): CanonicalContext {
  const attribution = getAttributionData();
  const landing = safeStorage("pp_landing_page");
  return {
    visitor_id: getVisitorId(),
    session_id: getSessionId(),
    presale_user_id: getPresaleUserId(),
    event_id: generateEventId(),
    occurred_at: new Date().toISOString(),
    page: {
      url: typeof window !== "undefined" ? window.location.href : "",
      path: typeof window !== "undefined" ? window.location.pathname : "",
      title: typeof document !== "undefined" ? document.title : "",
      referrer: getReferrer(),
    },
    device: {
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      type: detectDeviceType(),
      language: typeof navigator !== "undefined" ? navigator.language : "en",
      timezone_offset: new Date().getTimezoneOffset(),
      screen_width: typeof window !== "undefined" ? window.screen.width : 0,
      screen_height: typeof window !== "undefined" ? window.screen.height : 0,
    },
    attribution: {
      first_utm: attribution.first_utm,
      last_utm: attribution.last_utm,
      landing_page: landing,
    },
    pixels: {
      fbp: getFbp(),
      fbc: getFbc(),
      gclid: attribution.last_utm.gclid || attribution.first_utm.gclid,
      fbclid: attribution.last_utm.fbclid || attribution.first_utm.fbclid,
    },
  };
}

function normalizeIdentity(identity: CanonicalIdentity = {}): CanonicalIdentity {
  const out: CanonicalIdentity = {};
  if (identity.email) out.email = String(identity.email).trim().toLowerCase();
  if (identity.first_name) out.first_name = String(identity.first_name).trim();
  if (identity.last_name) out.last_name = String(identity.last_name).trim();
  if (identity.phone) out.phone = String(identity.phone).trim();
  if (identity.user_id) out.user_id = identity.user_id;
  return out;
}

export interface BuildLeadInput {
  form_type: CanonicalFormType;
  lead_source: CanonicalLeadSource;
  identity: CanonicalIdentity;
  message?: string;
  persona?: CanonicalPersona;
  intent_score?: number;
  project?: { id?: string; name?: string; slug?: string };
  extras?: Record<string, unknown>;
}

export function buildCanonicalLead(input: BuildLeadInput): CanonicalLead {
  return {
    kind: "lead",
    form_type: input.form_type,
    lead_source: input.lead_source,
    identity: normalizeIdentity(input.identity),
    message: input.message?.trim() || undefined,
    persona: input.persona,
    intent_score: input.intent_score,
    project: input.project,
    extras: input.extras,
    context: buildContext(),
  };
}

export interface BuildEventInput {
  event_name: CanonicalEventName;
  identity?: CanonicalIdentity;
  payload?: Record<string, unknown>;
}

export function buildCanonicalEvent(input: BuildEventInput): CanonicalEvent {
  return {
    kind: "event",
    event_name: input.event_name,
    identity: input.identity ? normalizeIdentity(input.identity) : undefined,
    payload: input.payload ?? {},
    context: buildContext(),
  };
}

// ============================================================================
//  ADAPTERS — convert canonical payloads into the legacy shapes the existing
//  edge functions / Supabase tables expect. This is the ONLY place that knows
//  the legacy field names.
// ============================================================================

/**
 * Flatten a CanonicalLead into the row shape expected by `project_leads`
 * and the `upsertProjectLead()` helper.
 */
export function leadToProjectLeadRow(lead: CanonicalLead): Record<string, any> {
  const ctx = lead.context;
  const fullName = [lead.identity.first_name, lead.identity.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  return {
    email: lead.identity.email,
    name: fullName || undefined,
    phone: lead.identity.phone,
    message: lead.message,
    form_type: lead.form_type,
    lead_source: lead.lead_source,
    persona: lead.persona,
    intent_score: lead.intent_score,
    project_id: lead.project?.id,
    project_name: lead.project?.name,
    visitor_id: ctx.visitor_id,
    session_id: ctx.session_id,
    utm_source: ctx.attribution.last_utm.source,
    utm_medium: ctx.attribution.last_utm.medium,
    utm_campaign: ctx.attribution.last_utm.campaign,
    utm_content: ctx.attribution.last_utm.content,
    utm_term: ctx.attribution.last_utm.term,
    referrer: ctx.page.referrer,
    landing_page: ctx.attribution.landing_page,
    fbp: ctx.pixels.fbp,
    fbc: ctx.pixels.fbc,
    gclid: ctx.pixels.gclid,
    fbclid: ctx.pixels.fbclid,
    event_id: ctx.event_id,
    extras: lead.extras,
  };
}

/**
 * Flatten a CanonicalLead into the body expected by `push-activity-to-crm`
 * (CRM bridge ingest-lead).
 */
export function leadToCrmBridgeBody(lead: CanonicalLead): Record<string, any> {
  return {
    event_type: lead.form_type,
    visitor_id: lead.context.visitor_id,
    session_id: lead.context.session_id,
    presale_user_id: lead.context.presale_user_id,
    event_id: lead.context.event_id,
    email: lead.identity.email,
    first_name: lead.identity.first_name,
    last_name: lead.identity.last_name,
    phone: lead.identity.phone,
    source: lead.lead_source,
    persona: lead.persona,
    intent_score: lead.intent_score,
    project: lead.project,
    // CRM `crm_contacts.projects` column is NOT NULL — always send an array.
    projects: lead.project?.name ? [lead.project.name] : [],
    payload: {
      ...(lead.extras ?? {}),
      message: lead.message,
      page_url: lead.context.page.url,
      page_path: lead.context.page.path,
      page_title: lead.context.page.title,
      referrer: lead.context.page.referrer,
      device: lead.context.device,
      attribution: lead.context.attribution,
      pixels: lead.context.pixels,
    },
  };
}

/**
 * Flatten a CanonicalEvent into the body expected by `push-activity-to-crm`.
 */
export function eventToCrmBridgeBody(evt: CanonicalEvent): Record<string, any> {
  return {
    event_type: evt.event_name,
    visitor_id: evt.context.visitor_id,
    session_id: evt.context.session_id,
    presale_user_id: evt.context.presale_user_id,
    event_id: evt.context.event_id,
    email: evt.identity?.email,
    first_name: evt.identity?.first_name,
    last_name: evt.identity?.last_name,
    phone: evt.identity?.phone,
    source: "presale_properties",
    payload: {
      ...evt.payload,
      page_url: evt.context.page.url,
      page_path: evt.context.page.path,
      page_title: evt.context.page.title,
      referrer: evt.context.page.referrer,
      device: evt.context.device,
      attribution: evt.context.attribution,
      pixels: evt.context.pixels,
    },
  };
}
