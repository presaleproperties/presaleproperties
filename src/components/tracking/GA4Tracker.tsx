/**
 * GA4Tracker
 * Loads Google Analytics 4 measurement ID from app_settings (key: ga4_measurement_id)
 * Falls back to VITE_GA4_MEASUREMENT_ID env var
 * Tracks page views on route changes
 */
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

function loadGA4Script(measurementId: string) {
  if (document.querySelector(`script[src*="${measurementId}"]`)) return;
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("config", measurementId, {
    send_page_view: false, // we send manually on route change
    cookie_flags: "SameSite=None;Secure",
  });
}

export function GA4Tracker() {
  const location = useLocation();
  const gaIdRef = useRef<string | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const envId = import.meta.env.VITE_GA4_MEASUREMENT_ID as string | undefined;

    if (envId && envId.startsWith("G-")) {
      gaIdRef.current = envId;
      loadGA4Script(envId);
      return;
    }

    // Load from app_settings
    supabase
      .from("app_settings")
      .select("value")
      .eq("key", "ga4_measurement_id")
      .maybeSingle()
      .then(({ data }) => {
        const id = (data?.value as string)?.trim();
        if (id && id.startsWith("G-")) {
          gaIdRef.current = id;
          loadGA4Script(id);
        }
      });
  }, []);

  // Track page views on route change
  useEffect(() => {
    const id = gaIdRef.current;
    if (!id || typeof window.gtag !== "function") return;
    window.gtag("config", id, {
      page_path: location.pathname + location.search,
    });
  }, [location]);

  return null;
}
