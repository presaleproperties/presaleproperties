import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function AgentManifestSwap() {
  const { pathname } = useLocation();
  const isDashboard = pathname.startsWith("/dashboard");

  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!link) return;

    const target = isDashboard ? "/manifest-agent.json" : "/manifest.json";
    if (link.href !== new URL(target, window.location.origin).href) {
      link.setAttribute("href", target);
    }
  }, [isDashboard]);

  return null;
}
