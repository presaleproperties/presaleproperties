/**
 * Multi-touch attribution capture.
 * Logs every UTM-bearing pageview to `attribution_touches` so we can compute
 * first-touch, last-touch, and assist-touch attribution for a lead.
 *
 * Auto-tags traffic from facebook/instagram/google when no UTM is present
 * (kills "(direct) / (none)" attribution loss).
 */
import { supabase } from "@/integrations/supabase/client";
import { getVisitorId } from "./tracking/identifiers";

const FIRST_TOUCH_FLAG = "pp_first_touch_logged";

function inferSourceFromReferrer(ref: string): { source: string; medium: string } | null {
  if (!ref) return null;
  try {
    const host = new URL(ref).hostname.toLowerCase();
    if (host.includes("facebook")) return { source: "facebook", medium: "social" };
    if (host.includes("instagram")) return { source: "instagram", medium: "social" };
    if (host.includes("l.instagram") || host.includes("lm.facebook")) return { source: "facebook", medium: "social" };
    if (host.includes("google.")) return { source: "google", medium: "organic" };
    if (host.includes("bing.")) return { source: "bing", medium: "organic" };
    if (host.includes("tiktok")) return { source: "tiktok", medium: "social" };
    if (host.includes("linkedin")) return { source: "linkedin", medium: "social" };
  } catch { /* invalid URL */ }
  return null;
}

export async function logAttributionTouch(): Promise<void> {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  let utm_source = params.get("utm_source") || "";
  let utm_medium = params.get("utm_medium") || "";
  const utm_campaign = params.get("utm_campaign") || "";
  const utm_content = params.get("utm_content") || "";
  const utm_term = params.get("utm_term") || "";

  // Auto-tag from referrer when no UTM present
  if (!utm_source && document.referrer) {
    const inferred = inferSourceFromReferrer(document.referrer);
    if (inferred) {
      utm_source = inferred.source;
      utm_medium = inferred.medium;
    }
  }

  // Only log if we have meaningful attribution
  if (!utm_source && !document.referrer) return;

  const visitorId = getVisitorId();
  const isFirst = !localStorage.getItem(FIRST_TOUCH_FLAG);
  if (isFirst) localStorage.setItem(FIRST_TOUCH_FLAG, "1");

  await supabase.from("attribution_touches").insert({
    visitor_id: visitorId,
    utm_source: utm_source || null,
    utm_medium: utm_medium || null,
    utm_campaign: utm_campaign || null,
    utm_content: utm_content || null,
    utm_term: utm_term || null,
    referrer: document.referrer || null,
    landing_url: isFirst ? window.location.href : null,
    page_url: window.location.href,
    is_first_touch: isFirst,
  });
}

/** Get first-touch UTM from local storage (set by `attribution.ts`) — used at form submit. */
export function getFirstTouchUtm(): { source: string; medium: string; campaign: string; at: string | null } {
  try {
    const raw = localStorage.getItem("pp_first_utm");
    if (!raw) return { source: "", medium: "", campaign: "", at: null };
    const p = JSON.parse(raw);
    return {
      source: p.source || "",
      medium: p.medium || "",
      campaign: p.campaign || "",
      at: p._at || null,
    };
  } catch {
    return { source: "", medium: "", campaign: "", at: null };
  }
}
