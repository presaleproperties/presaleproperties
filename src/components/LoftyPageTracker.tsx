import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { safeTrackingInvoke } from "@/lib/tracking/safeInvoke";
import { getVisitorId, getSessionId } from "@/hooks/useLoftyTracking";

/**
 * Global page tracker that automatically sends page view events
 * via the server-side edge function whenever the route changes.
 * Webhook URLs are never exposed to the client.
 */
export function LoftyPageTracker() {
  const location = useLocation();
  const lastTrackedPath = useRef<string>("");

  useEffect(() => {
    const currentPath = location.pathname;
    if (currentPath === lastTrackedPath.current) return;
    
    lastTrackedPath.current = currentPath;

    const trackPageView = async () => {
      const utmSource = sessionStorage.getItem("utm_source") || undefined;
      const utmMedium = sessionStorage.getItem("utm_medium") || undefined;
      const utmCampaign = sessionStorage.getItem("utm_campaign") || undefined;
      const referrerUrl = sessionStorage.getItem("referrer") || document.referrer || undefined;

      const payload = {
        activity_type: "page_view",
        visitor_id: getVisitorId(),
        session_id: getSessionId(),
        page_url: window.location.href,
        page_title: document.title,
        referrer: referrerUrl,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        device_type: window.innerWidth < 768 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop",
      };

      // Route through edge function — webhook forwarding happens server-side.
      // Transport errors (preview proxy, ad-blockers) are silenced inside the helper.
      await safeTrackingInvoke("track-client-activity", payload);
    };

    const timeoutId = setTimeout(trackPageView, 100);
    return () => clearTimeout(timeoutId);
  }, [location.pathname]);

  return null;
}
