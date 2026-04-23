import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Swaps the PWA manifest based on the current route so users can install
 * different "apps" from different sections of the site:
 *  - /admin/*     → Admin app, opens at /admin/leads
 *  - /dashboard/* → Agent Hub app, opens at /dashboard
 *  - everything else → Main public site, opens at /
 */
export function AgentManifestSwap() {
  const { pathname } = useLocation();

  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!link) return;

    let target = "/manifest.json";
    if (pathname.startsWith("/admin")) {
      target = "/manifest-admin.json";
    } else if (pathname.startsWith("/dashboard")) {
      target = "/manifest-agent.json";
    }

    if (link.href !== new URL(target, window.location.origin).href) {
      link.setAttribute("href", target);
    }
  }, [pathname]);

  return null;
}
