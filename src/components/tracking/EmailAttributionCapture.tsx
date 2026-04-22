import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { captureEmailAttributionFromUrl } from "@/lib/emailAttribution";

/**
 * Captures `em_*` URL params (set by the track-email-open redirect) into
 * sessionStorage so downstream lead-form submits can attribute themselves
 * back to the specific email + card the user clicked.
 *
 * Mounted once near the app root (after the router so useLocation is valid).
 */
export function EmailAttributionCapture() {
  const location = useLocation();

  useEffect(() => {
    captureEmailAttributionFromUrl();
  }, [location.pathname, location.search]);

  return null;
}
