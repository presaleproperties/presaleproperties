import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Loads custom favicon/OG-image URLs from app_settings and applies them
 * to the document head on every page load. This ensures Google and browsers
 * always see the correct branding assets.
 */
export function FaviconLoader() {
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase
          .from("app_settings")
          .select("value")
          .eq("key", "favicon_settings")
          .maybeSingle();

        if (!data?.value) return;

        const urls = data.value as Record<string, string>;

        // Update favicon links
        document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]').forEach((link) => {
          const el = link as HTMLLinkElement;
          const sizes = el.getAttribute("sizes");
          if (sizes === "512x512" && urls.favicon_512) {
            el.href = urls.favicon_512;
          } else if (urls.favicon_32) {
            el.href = urls.favicon_32;
          }
        });

        // Apple touch icon
        const apple = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement | null;
        if (apple && urls.apple_touch_icon) apple.href = urls.apple_touch_icon;

        // OG image
        const ogImg = document.querySelector('meta[property="og:image"]') as HTMLMetaElement | null;
        if (ogImg && urls.og_image) ogImg.content = urls.og_image;
        const twImg = document.querySelector('meta[name="twitter:image"]') as HTMLMetaElement | null;
        if (twImg && urls.og_image) twImg.content = urls.og_image;
      } catch (err) {
        // Silent fail — default favicons in HTML remain
      }
    };

    load();
  }, []);

  return null;
}
