/**
 * Behavioral Event Tracking
 * Sends all events to Zapier webhook with rich payload
 */

import { safeTrackingInvoke } from "./safeInvoke";
import { getVisitorId, getSessionId, generateEventId } from "./identifiers";
import { getAttributionData, getReferrer } from "./attribution";

// Debug mode - logs all payloads to console
const DEBUG_MODE = import.meta.env.DEV;

// Cache for intent scoring module (lazy loaded to avoid circular deps)
let intentScoringModule: typeof import("./intentScoring") | null = null;

async function getIntentScoringModule() {
  if (!intentScoringModule) {
    intentScoringModule = await import("./intentScoring");
  }
  return intentScoringModule;
}

/**
 * Detect device type from user agent
 */
function getDeviceType(): "mobile" | "tablet" | "desktop" {
  const ua = navigator.userAgent.toLowerCase();

  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return "tablet";
  }

  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) {
    return "mobile";
  }

  return "desktop";
}

/**
 * Build base payload included with every event
 */
function buildBasePayload() {
  const attribution = getAttributionData();

  return {
    event_id: generateEventId(),
    timestamp: new Date().toISOString(),
    visitor_id: getVisitorId(),
    session_id: getSessionId(),
    page_url: window.location.href,
    page_path: window.location.pathname,
    page_title: document.title,
    referrer: getReferrer(),
    user_agent: navigator.userAgent,
    device_type: getDeviceType(),
    language: navigator.language,
    timezone_offset: new Date().getTimezoneOffset(),
    screen_width: window.screen.width,
    screen_height: window.screen.height,
    first_utm: attribution.first_utm,
    last_utm: attribution.last_utm,
  };
}

/**
 * Send event to Zapier behavior webhook (via backend proxy to avoid ad-blockers)
 */
async function sendEvent(eventName: string, eventPayload: object = {}): Promise<void> {
  // Import intent scoring lazily to avoid circular deps
  const { getIntentScore, getCityInterests, getTopViewedProjects, getBehaviorSummary } =
    await getIntentScoringModule();

  const payload = {
    ...buildBasePayload(),
    event_name: eventName,
    event_payload: eventPayload,
    // Include intent data in all events
    intent_score: getIntentScore(),
    city_interest: getCityInterests(),
    project_interest: getTopViewedProjects().map((p) => p.project_id),
    // Include full behavior summary for form submissions
    ...(eventName === "form_submit" ? { behavior_summary: getBehaviorSummary() } : {}),
  };

  if (DEBUG_MODE) {
    console.log(`📊 [Tracking] ${eventName}:`, payload);
  }

  // Fire-and-forget. Transport errors (e.g. preview-iframe fetch proxy,
  // ad-blockers) are silenced inside safeTrackingInvoke so they never bubble
  // up as user-visible errors or pollute the console.
  await safeTrackingInvoke("send-behavior-event", payload);
}

// ============ EVENT TRACKING FUNCTIONS ============

/**
 * Track page view
 */
export function trackPageView(): void {
  sendEvent("page_view", {});
  // Update local behavior buffer + stream to CRM (anonymous-friendly)
  import("./behaviorBuffer").then(({ recordPageView }) => recordPageView());
  import("./streamBehavior").then(({ streamBehavior }) => streamBehavior());
}

/**
 * Track property/project view
 */
export interface PropertyViewData {
  project_id: string;
  project_name: string;
  address?: string;
  city: string;
  price_from?: number | null;
  beds?: number;
  baths?: number;
}

export function trackPropertyView(data: PropertyViewData): void {
  sendEvent("property_view", data);
  // Buffer for CRM bundle + stream live
  import("./behaviorBuffer").then(({ recordPropertyView }) => {
    recordPropertyView({
      property_id: data.project_id,
      property_name: data.project_name,
      property_url: typeof window !== "undefined" ? window.location.href : "",
      action: "view",
    });
  });
  import("./streamBehavior").then(({ streamBehavior }) => streamBehavior());
  // Mirror to Meta as ViewContent (dual-send: Pixel + CAPI)
  import("./metaPixel").then(({ Meta }) => {
    Meta.viewContent({
      content_name: data.project_name,
      content_ids: [data.project_id],
      value: data.price_from ?? undefined,
      city: data.city,
      content_category: "presale_project",
    }).catch(() => {});
  });
}

/**
 * Track search
 */
export interface SearchData {
  city?: string;
  min_price?: number;
  max_price?: number;
  beds?: number;
  baths?: number;
  property_type?: string;
  keywords?: string;
  results_count?: number;
}

export function trackSearch(data: SearchData): void {
  sendEvent("search", data);
  import("./metaPixel").then(({ Meta }) => {
    const parts = [data.city, data.property_type, data.keywords].filter(Boolean);
    Meta.search({
      search_string: parts.join(" ") || "browse",
      city: data.city,
      num_items: data.results_count,
    }).catch(() => {});
  });
}

/**
 * Track floorplan view
 */
export interface FloorplanViewData {
  project_id: string;
  project_name: string;
  floorplan_id?: string;
  floorplan_name?: string;
  beds?: number;
  baths?: number;
  sqft?: number;
}

export function trackFloorplanView(data: FloorplanViewData): void {
  sendEvent("floorplan_view", data);
}

/**
 * Track floorplan download
 */
export interface FloorplanDownloadData {
  project_id: string;
  floorplan_id?: string;
  asset_url: string;
}

export function trackFloorplanDownload(data: FloorplanDownloadData): void {
  sendEvent("floorplan_download", data);
}

/**
 * Track favorite add
 */
export interface FavoriteData {
  project_id: string;
  project_name: string;
}

export function trackFavoriteAdd(data: FavoriteData): void {
  sendEvent("favorite_add", data);
  import("./behaviorBuffer").then(({ recordPropertyView }) => recordPropertyView({
    property_id: data.project_id,
    property_name: data.project_name,
    property_url: typeof window !== "undefined" ? window.location.href : "",
    action: "favorite",
  }));
  import("./streamBehavior").then(({ streamBehavior }) => streamBehavior());
}

/**
 * Track favorite remove
 */
export function trackFavoriteRemove(data: FavoriteData): void {
  sendEvent("favorite_remove", data);
}

/**
 * Track CTA click
 */
export interface CTAClickData {
  cta_name: string;
  cta_location: string;
  destination_url?: string;
}

export function trackCTAClick(data: CTAClickData): void {
  sendEvent("cta_click", data);
}

/**
 * Track form start
 */
export interface FormStartData {
  form_name: string;
  form_location: string;
}

export function trackFormStart(data: FormStartData): void {
  sendEvent("form_start", data);
  import("./behaviorBuffer").then(({ recordFormEvent }) => recordFormEvent({
    form_type: data.form_name,
    status: "started",
  }));
  import("./streamBehavior").then(({ streamBehavior }) => streamBehavior());
}

/**
 * Track form submit
 */
export interface FormSubmitData {
  form_name: string;
  form_location: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  user_type?: "buyer" | "investor" | "realtor" | string;
  consent_sms?: boolean;
  consent_email?: boolean;
  // Allow additional fields
  [key: string]: unknown;
}

export function trackFormSubmit(data: FormSubmitData): void {
  sendEvent("form_submit", data);
  // Buffer + stream — pin known email so the CRM can stitch identity
  import("./behaviorBuffer").then(({ recordFormEvent }) => recordFormEvent({
    form_type: data.form_name || "signup_completed",
    status: "completed",
    funnel_step: typeof data.funnel_step === "number" ? data.funnel_step as number : undefined,
    funnel_total_steps: typeof data.funnel_total_steps === "number" ? data.funnel_total_steps as number : undefined,
  }));
  import("./streamBehavior").then(({ streamBehavior, setKnownEmail }) => {
    if (data.email) setKnownEmail(String(data.email));
    streamBehavior({ immediate: true });
  });
  // Estimated lead value by persona — drives FB ad bid optimization
  const personaValue: Record<string, number> = {
    investor: 200,
    buyer: 100,
    realtor: 50,
  };
  const value = personaValue[String(data.user_type ?? "").toLowerCase()] ?? 75;
  import("./metaPixel").then(async ({ Meta }) => {
    const { getIntentScore } = await import("./intentScoring");
    Meta.lead(
      {
        email: data.email,
        phone: data.phone,
        first_name: data.first_name,
        last_name: data.last_name,
      },
      {
        content_name: data.form_name,
        content_category: data.form_location,
        value,
        persona: data.user_type ? String(data.user_type) : undefined,
        intent_score: getIntentScore(),
      }
    ).catch(() => {});
  });
}

/**
 * Track return visit
 */
export function trackReturnVisit(data: { last_page_viewed?: string; project_context?: string }): void {
  sendEvent("return_visit", data);
}

// Export for direct use
export { sendEvent };
