/**
 * BehaviorTracker Component
 * 
 * Place this component inside BrowserRouter to:
 * 1. Initialize visitor/session IDs
 * 2. Initialize attribution tracking
 * 3. Track page views on route changes
 * 4. Detect and track return visits
 * 5. Update last page viewed
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

export function BehaviorTracker() {
  const location = useLocation();
  const lastTrackedPath = useRef<string>("");
  const initialized = useRef(false);

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
