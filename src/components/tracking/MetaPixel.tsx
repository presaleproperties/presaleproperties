/**
 * Meta Pixel (Facebook Pixel) Integration
 * 
 * Loads Meta Pixel script and tracks PageView events on route changes.
 * Pixel ID is fetched from app_settings (key: "meta_pixel_id")
 */

import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FbqFunction = (...args: any[]) => void;

export function MetaPixel() {
  const location = useLocation();
  const pixelIdRef = useRef<string | null>(null);
  const initializedRef = useRef(false);

  // Initialize pixel on mount
  useEffect(() => {
    const initPixel = async () => {
      if (initializedRef.current) return;

      // Fetch pixel ID from settings
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "meta_pixel_id")
        .maybeSingle();

      const pixelId = typeof data?.value === "string" ? data.value : null;
      
      if (!pixelId) {
        if (import.meta.env.DEV) {
          console.log("📊 [Meta Pixel] No Pixel ID configured");
        }
        return;
      }

      pixelIdRef.current = pixelId;
      initializedRef.current = true;

      // Load Meta Pixel script
      const w = window as unknown as { fbq?: FbqFunction; _fbq?: FbqFunction };
      if (w.fbq) return;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const n: any = function() {
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

      w.fbq("init", pixelId);
      w.fbq("track", "PageView");

      if (import.meta.env.DEV) {
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
    
    if (import.meta.env.DEV) {
      console.log("📊 [Meta Pixel] PageView:", location.pathname);
    }
  }, [location.pathname]);

  return null;
}

// Helper to track custom events from anywhere
export function trackMetaEvent(eventName: string, params?: Record<string, unknown>) {
  const w = window as unknown as { fbq?: FbqFunction };
  if (w.fbq) {
    w.fbq("track", eventName, params);
    
    if (import.meta.env.DEV) {
      console.log("📊 [Meta Pixel] Event:", eventName, params);
    }
  }
}

// Standard Meta events for convenience
export const MetaEvents = {
  lead: (params?: { content_name?: string; value?: number }) => 
    trackMetaEvent("Lead", params),
  viewContent: (params: { content_name: string; content_ids?: string[] }) => 
    trackMetaEvent("ViewContent", params),
  search: (params: { search_string: string }) => 
    trackMetaEvent("Search", params),
  contact: () => 
    trackMetaEvent("Contact"),
  schedule: () => 
    trackMetaEvent("Schedule"),
};
