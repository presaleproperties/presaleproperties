import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { logAttributionTouch } from "@/lib/multiTouchAttribution";

/**
 * Records every UTM/referrer touchpoint to attribution_touches.
 * Mounted once near the app root (after the router).
 */
export function AttributionTracker() {
  const location = useLocation();

  useEffect(() => {
    // Defer slightly so we don't compete with first-paint
    const t = setTimeout(() => {
      logAttributionTouch().catch(() => undefined);
    }, 600);
    return () => clearTimeout(t);
  }, [location.pathname]);

  return null;
}
