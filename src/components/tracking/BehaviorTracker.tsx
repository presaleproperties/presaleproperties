/**
 * BehaviorTracker Component
 * 
 * Place this component inside BrowserRouter to:
 * 1. Initialize visitor/session IDs
 * 2. Initialize attribution tracking
 * 3. Track page views on route changes
 */

import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { 
  getVisitorId, 
  getSessionId, 
  initAttribution, 
  trackPageView 
} from "@/lib/tracking";

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
    
    if (import.meta.env.DEV) {
      console.log("📊 [Tracking] Initialized", {
        visitor_id: getVisitorId(),
        session_id: getSessionId(),
      });
    }
  }, []);

  // Track page views on route change
  useEffect(() => {
    const currentPath = location.pathname;
    
    // Skip if same path (ignore query param changes)
    if (currentPath === lastTrackedPath.current) return;
    
    lastTrackedPath.current = currentPath;
    
    // Small delay to ensure page title is updated
    const timeoutId = setTimeout(() => {
      trackPageView();
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [location.pathname]);

  return null;
}
