import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getVisitorId, getSessionId } from "@/hooks/useLoftyTracking";

/**
 * Global page tracker that automatically sends page view events to Lofty CRM
 * whenever the route changes. This component should be placed inside BrowserRouter.
 */
export function LoftyPageTracker() {
  const location = useLocation();
  const lastTrackedPath = useRef<string>("");

  useEffect(() => {
    // Only track if path actually changed (not just search params)
    const currentPath = location.pathname;
    if (currentPath === lastTrackedPath.current) return;
    
    lastTrackedPath.current = currentPath;

    const trackPageView = async () => {
      try {
        // Fetch the Lofty tracking webhook URL from app_settings
        const { data: settingData } = await supabase
          .from("app_settings")
          .select("value")
          .eq("key", "lofty_tracking_webhook")
          .maybeSingle();

        const webhookUrl = settingData?.value as string | null;
        
        if (!webhookUrl) {
          console.log("Lofty tracking webhook not configured");
          return;
        }

        // Get UTM parameters from session storage
        const utmSource = sessionStorage.getItem("utm_source") || undefined;
        const utmMedium = sessionStorage.getItem("utm_medium") || undefined;
        const utmCampaign = sessionStorage.getItem("utm_campaign") || undefined;
        const utmContent = sessionStorage.getItem("utm_content") || undefined;
        const utmTerm = sessionStorage.getItem("utm_term") || undefined;
        const landingPage = sessionStorage.getItem("landing_page") || undefined;
        const referrerUrl = sessionStorage.getItem("referrer") || document.referrer || undefined;

        // Determine page type from path
        let pageType = "page";
        if (currentPath.startsWith("/presale-projects/") && currentPath !== "/presale-projects") {
          pageType = "project_detail";
        } else if (currentPath === "/presale-projects") {
          pageType = "project_directory";
        } else if (currentPath.startsWith("/properties/") && currentPath !== "/properties") {
          pageType = "listing_detail";
        } else if (currentPath === "/properties") {
          pageType = "listing_directory";
        } else if (currentPath.startsWith("/blog/") && currentPath !== "/blog") {
          pageType = "blog_post";
        } else if (currentPath === "/blog") {
          pageType = "blog_directory";
        } else if (currentPath === "/") {
          pageType = "homepage";
        } else if (currentPath === "/map-search") {
          pageType = "map_search";
        } else if (currentPath === "/assignments") {
          pageType = "assignments";
        } else if (currentPath === "/contact") {
          pageType = "contact";
        } else if (currentPath === "/about") {
          pageType = "about";
        } else if (currentPath.includes("-presale") || currentPath.includes("-resale")) {
          pageType = "city_page";
        }

        const payload = {
          event_type: "page_view",
          page_type: pageType,
          page_url: window.location.href,
          page_path: currentPath,
          page_title: document.title,
          timestamp: new Date().toISOString(),
          visitor_id: getVisitorId(),
          session_id: getSessionId(),
          user_agent: navigator.userAgent,
          screen_width: window.innerWidth,
          screen_height: window.innerHeight,
          referrer: referrerUrl,
          landing_page: landingPage,
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
          utm_content: utmContent,
          utm_term: utmTerm,
        };

        console.log("Lofty page view tracked:", payload);

        // Send to Zapier webhook
        await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          mode: "no-cors",
          body: JSON.stringify(payload),
        });
      } catch (error) {
        console.error("Error tracking page view:", error);
      }
    };

    // Small delay to ensure page title is updated
    const timeoutId = setTimeout(trackPageView, 100);
    
    return () => clearTimeout(timeoutId);
  }, [location.pathname]);

  return null;
}
