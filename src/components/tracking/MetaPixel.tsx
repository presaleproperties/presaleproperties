/**
 * Meta Pixel (Facebook Pixel) Integration
 * 
 * Comprehensive tracking for:
 * - PageViews on route changes
 * - Property views (ViewContent)
 * - Form starts (InitiateCheckout)
 * - Form completions (Lead)
 * - Searches
 * - Tour bookings (Schedule)
 * 
 * Pixel ID is fetched from app_settings (key: "meta_pixel_id")
 */

import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { captureFbClickId } from "@/lib/tracking/metaPixel";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FbqFunction = (...args: any[]) => void;

// Debug mode for development
const DEBUG_MODE = import.meta.env.DEV;

export function MetaPixel() {
  const location = useLocation();
  const pixelIdRef = useRef<string | null>(null);
  const initializedRef = useRef(false);

  // Initialize pixel on mount
  useEffect(() => {
    // Capture fbclid → _fbc cookie on first load (required for CAPI attribution)
    captureFbClickId();

    const initPixel = async () => {
      if (initializedRef.current) return;

      // Fetch pixel ID from settings
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "meta_pixel_id")
        .maybeSingle();

      // Pixel ID may be stored as string OR number in JSON column
      const raw = data?.value;
      const pixelId = raw != null ? String(raw) : null;

      if (!pixelId) {
        if (DEBUG_MODE) {
          console.log("📊 [Meta Pixel] No Pixel ID configured");
        }
        return;
      }

      pixelIdRef.current = pixelId;

      // Ensure fbq exists (create stub if needed)
      const w = window as unknown as { fbq?: FbqFunction; _fbq?: FbqFunction };
      if (!w.fbq) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const n: any = function () {
          // eslint-disable-next-line prefer-rest-params
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!w._fbq) w._fbq = n;
        n.push = n;
        n.loaded = true;
        n.version = "2.0";
        n.queue = [];
        w.fbq = n;

        const script = document.createElement("script");
        script.async = true;
        script.src = "https://connect.facebook.net/en_US/fbevents.js";
        const firstScript = document.getElementsByTagName("script")[0];
        firstScript?.parentNode?.insertBefore(script, firstScript);
      }

      // Always init with our Pixel ID (fbq may already exist from other scripts)
      w.fbq?.("init", pixelId);
      w.fbq?.("track", "PageView");

      initializedRef.current = true;

      if (DEBUG_MODE) {
        console.log("📊 [Meta Pixel] Initialized with ID:", pixelId);
      }
    };

    initPixel();
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (!initializedRef.current) return;
    
    const w = window as unknown as { fbq?: FbqFunction };
    if (!w.fbq) return;
    
    w.fbq("track", "PageView");
    
    if (DEBUG_MODE) {
      console.log("📊 [Meta Pixel] PageView:", location.pathname);
    }
  }, [location.pathname]);

  return null;
}

/**
 * Track custom Meta events from anywhere in the app
 */
export function trackMetaEvent(eventName: string, params?: Record<string, unknown>) {
  const w = window as unknown as { fbq?: FbqFunction };
  if (w.fbq) {
    w.fbq("track", eventName, params);
    
    if (DEBUG_MODE) {
      console.log("📊 [Meta Pixel] Event:", eventName, params);
    }
  }
}

/**
 * Track custom events (non-standard)
 */
export function trackMetaCustomEvent(eventName: string, params?: Record<string, unknown>) {
  const w = window as unknown as { fbq?: FbqFunction };
  if (w.fbq) {
    w.fbq("trackCustom", eventName, params);
    
    if (DEBUG_MODE) {
      console.log("📊 [Meta Pixel] Custom Event:", eventName, params);
    }
  }
}

// ============ STANDARD META EVENTS ============

export const MetaEvents = {
  /**
   * Track lead form submission
   */
  lead: (params?: { 
    content_name?: string; 
    content_category?: string;
    value?: number;
    currency?: string;
  }) => trackMetaEvent("Lead", { currency: "CAD", ...params }),
  
  /**
   * Track property/project page view
   */
  viewContent: (params: { 
    content_name: string; 
    content_ids?: string[];
    content_type?: string;
    content_category?: string;
    value?: number;
    currency?: string;
  }) => trackMetaEvent("ViewContent", { content_type: "property", currency: "CAD", ...params }),
  
  /**
   * Track search actions
   */
  search: (params: { 
    search_string: string;
    content_category?: string;
  }) => trackMetaEvent("Search", params),
  
  /**
   * Track when user starts filling a form (InitiateCheckout = form start)
   */
  formStart: (params: { 
    content_name: string;
    content_category?: string;
  }) => trackMetaEvent("InitiateCheckout", params),
  
  /**
   * Track contact form submissions
   */
  contact: (params?: { content_name?: string }) => 
    trackMetaEvent("Contact", params),
  
  /**
   * Track tour/showing bookings
   */
  schedule: (params?: { 
    content_name?: string;
    content_category?: string;
  }) => trackMetaEvent("Schedule", params),
  
  /**
   * Track when user completes registration/signup
   */
  completeRegistration: (params?: {
    content_name?: string;
    status?: string;
  }) => trackMetaEvent("CompleteRegistration", params),
};

// ============ CUSTOM EVENTS FOR FUNNEL ANALYSIS ============

export const MetaCustomEvents = {
  /**
   * Track form abandonment (user started but didn't finish)
   */
  formAbandon: (params: { 
    form_name: string;
    form_location: string;
    fields_filled?: number;
  }) => trackMetaCustomEvent("FormAbandon", params),
  
  /**
   * Track floorplan views
   */
  floorplanView: (params: { 
    project_name: string;
    project_id?: string;
  }) => trackMetaCustomEvent("FloorplanView", params),
  
  /**
   * Track floorplan downloads
   */
  floorplanDownload: (params: { 
    project_name: string;
    project_id?: string;
  }) => trackMetaCustomEvent("FloorplanDownload", params),
  
  /**
   * Track favorites/saves
   */
  addToWishlist: (params: { 
    content_name: string;
    content_ids?: string[];
    content_type?: string;
  }) => trackMetaEvent("AddToWishlist", params),
  
  /**
   * Track map interactions
   */
  mapInteraction: (params: { 
    action: "zoom" | "pan" | "marker_click";
    location?: string;
  }) => trackMetaCustomEvent("MapInteraction", params),
  
  /**
   * Track calculator usage
   */
  calculatorUse: (params: { 
    calculator_type: string;
    inputs_completed?: boolean;
  }) => trackMetaCustomEvent("CalculatorUse", params),
  
  /**
   * Track high-intent signals
   */
  highIntent: (params: { 
    signal_type: string;
    project_name?: string;
  }) => trackMetaCustomEvent("HighIntent", params),
};
