import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * Pixel Health Check — verifies that Meta Pixel + GA4 + the _fbp cookie
 * actually fired on each page view. Logs to `pixel_health_log`.
 * Throttled to one check per page per session.
 */
const CHECKED_KEY = "pp_pixel_checked_paths";

function getCheckedPaths(): Set<string> {
  try {
    const raw = sessionStorage.getItem(CHECKED_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function setCheckedPaths(paths: Set<string>) {
  try { sessionStorage.setItem(CHECKED_KEY, JSON.stringify([...paths])); } catch { /* noop */ }
}

function hasFbp(): boolean {
  return /(?:^|;\s*)_fbp=/.test(document.cookie);
}

function pageType(pathname: string): string {
  if (pathname.startsWith("/lp/")) return "landing_page";
  if (pathname.includes("-presale-")) return "project_organic";
  if (pathname.startsWith("/blog")) return "blog";
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname === "/") return "home";
  return "other";
}

export function PixelHealthCheck() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith("/admin")) return;

    const checked = getCheckedPaths();
    if (checked.has(location.pathname)) return;

    // Wait for pixels to load
    const t = setTimeout(() => {
      const pixelLoaded = typeof (window as any).fbq === "function";
      const gaLoaded = typeof (window as any).gtag === "function" || Array.isArray((window as any).dataLayer);
      const fbpSet = hasFbp();

      const errors: string[] = [];
      if (!pixelLoaded) errors.push("fbq missing");
      if (!gaLoaded) errors.push("gtag/dataLayer missing");
      if (!fbpSet) errors.push("_fbp cookie missing");

      supabase.from("pixel_health_log").insert({
        page_url: window.location.href,
        page_type: pageType(location.pathname),
        pixel_loaded: pixelLoaded,
        ga_loaded: gaLoaded,
        fbp_set: fbpSet,
        error_message: errors.length ? errors.join("; ") : null,
      }).then(() => undefined);

      checked.add(location.pathname);
      setCheckedPaths(checked);
    }, 3500);

    return () => clearTimeout(t);
  }, [location.pathname]);

  return null;
}
