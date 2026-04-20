/**
 * ContactClickTracker
 *
 * Global event-delegation listener that pushes `phone_click` and
 * `whatsapp_click` events to dataLayer whenever a user clicks any
 * `tel:` or `wa.me` / `whatsapp.com` link, anywhere on the site.
 *
 * Mounted once at the app root.
 */
import { useEffect } from "react";
import { pushClickEvent } from "@/lib/tracking";

export function ContactClickTracker() {
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    const handler = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (!target || typeof target.closest !== "function") return;
      const anchor = target.closest("a") as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute("href") || "";
      if (!href) return;

      const text = (anchor.textContent || "").trim().slice(0, 120);

      if (href.startsWith("tel:")) {
        pushClickEvent("phone_click", href, text);
        return;
      }

      // WhatsApp links: wa.me, api.whatsapp.com, whatsapp://
      if (
        href.includes("wa.me/") ||
        href.includes("api.whatsapp.com") ||
        href.startsWith("whatsapp:")
      ) {
        pushClickEvent("whatsapp_click", href, text);
      }
    };

    // Capture phase so we fire even if the handler stops propagation
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, []);

  return null;
}
