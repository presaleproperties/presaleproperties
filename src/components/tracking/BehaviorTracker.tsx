/**
 * BehaviorTracker Component
 * 
 * Place this component inside BrowserRouter to:
 * 1. Initialize visitor/session IDs
 * 2. Initialize attribution tracking
 * 3. Track page views on route changes
 * 4. Detect and track return visits
 * 5. Update last page viewed
 * 6. Track email click-throughs via cid parameter
 */

import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { 
  getVisitorId, 
  getSessionId, 
  initAttribution, 
  trackPageView,
  checkReturnVisit,
  setLastPageViewed,
  getLastPageViewed,
} from "@/lib/tracking";
import { trackReturnVisit } from "@/lib/tracking/events";
import { supabase } from "@/integrations/supabase/client";

export function BehaviorTracker() {
  const location = useLocation();
  const lastTrackedPath = useRef<string>("");
  const initialized = useRef(false);

  // Track email click-through when cid parameter is present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const clientId = params.get("cid");
    const utmSource = params.get("utm_source");
    const utmMedium = params.get("utm_medium");
    
    // If this is an email click-through
    if (clientId && utmSource === "email") {
      // Log activity to the database
      const trackEmailClick = async () => {
        try {
          await supabase.from("client_activity").insert({
            client_id: clientId,
            activity_type: "email_click",
            page_url: window.location.pathname,
            page_title: document.title,
            utm_source: utmSource,
            utm_medium: utmMedium,
            utm_campaign: params.get("utm_campaign"),
            referrer: "email",
          });
          
          if (import.meta.env.DEV) {
            console.log("📊 [Tracking] Email click tracked", { clientId, path: location.pathname });
          }
        } catch (error) {
          console.error("Failed to track email click:", error);
        }
      };
      
      trackEmailClick();
    }
  }, [location.pathname, location.search]);

  // Initialize tracking on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    
    // Initialize visitor and session IDs
    getVisitorId();
    getSessionId();
    
    // Initialize attribution (UTM capture)
    initAttribution();
    
    // Check for return visit and track if applicable
    const isReturnVisit = checkReturnVisit();
    if (isReturnVisit) {
      const lastPage = getLastPageViewed();
      trackReturnVisit({
        last_page_viewed: lastPage,
      });
      
      if (import.meta.env.DEV) {
        console.log("📊 [Tracking] Return visit detected", { last_page_viewed: lastPage });
      }
    }
    
    if (import.meta.env.DEV) {
      console.log("📊 [Tracking] Initialized", {
        visitor_id: getVisitorId(),
        session_id: getSessionId(),
        is_return_visit: isReturnVisit,
      });
    }

    // Flush behavior to CRM on tab close / hide via sendBeacon
    const flush = () => {
      import("@/lib/tracking/streamBehavior").then(({ streamBehavior }) =>
        streamBehavior({ immediate: true, beacon: true }),
      );
    };
    const onVisibility = () => { if (document.visibilityState === "hidden") flush(); };
    window.addEventListener("beforeunload", flush);
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("beforeunload", flush);
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // Track page views on route change
  useEffect(() => {
    const currentPath = location.pathname;
    
    // Skip if same path (ignore query param changes)
    if (currentPath === lastTrackedPath.current) return;
    
    lastTrackedPath.current = currentPath;
    
    // Update last page viewed
    setLastPageViewed(currentPath);
    
    // Small delay to ensure page title is updated
    const timeoutId = setTimeout(() => {
      trackPageView();
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [location.pathname]);

  return null;
}
