import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * PwaSessionMemory
 * ─────────────────────────────────────────────────────────────
 * For PWAs (admin + agent) installed to the home screen:
 *  • Persists the last-visited path within the section
 *  • On cold launch (manifest start_url with ?pwa=1), restores
 *    the user to where they left off
 *  • Falls back to the section root (/admin or /dashboard)
 *
 * Persistence is per-section so the admin and agent apps keep
 * independent histories.
 */

type Section = {
  prefix: string;        // e.g. "/admin"
  storageKey: string;    // e.g. "pwa:lastPath:admin"
  fallback: string;      // path used if no memory exists
};

const SECTIONS: Section[] = [
  { prefix: "/admin", storageKey: "pwa:lastPath:admin", fallback: "/admin" },
  { prefix: "/dashboard", storageKey: "pwa:lastPath:agent", fallback: "/dashboard" },
];

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true
  );
}

function matchSection(pathname: string): Section | null {
  return SECTIONS.find((s) => pathname === s.prefix || pathname.startsWith(s.prefix + "/")) ?? null;
}

export function PwaSessionMemory() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const restoredRef = useRef(false);

  // ── On first mount: if PWA cold launch, restore last path ─────
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;

    if (!isStandalone()) return;

    const params = new URLSearchParams(search);
    const isColdLaunch = params.has("pwa");
    if (!isColdLaunch) return;

    const section = matchSection(pathname);
    if (!section) return;

    const last = (() => {
      try {
        return localStorage.getItem(section.storageKey);
      } catch {
        return null;
      }
    })();

    // Strip the ?pwa=1 marker either way
    const target =
      last && last.startsWith(section.prefix) && last !== pathname + search
        ? last
        : section.fallback;

    navigate(target, { replace: true });
  }, [pathname, search, navigate]);

  // ── On every navigation: remember current path per section ────
  useEffect(() => {
    if (!isStandalone()) return;
    const section = matchSection(pathname);
    if (!section) return;

    // Don't store the cold-launch URL itself
    const cleanSearch = (() => {
      const p = new URLSearchParams(search);
      p.delete("pwa");
      const s = p.toString();
      return s ? `?${s}` : "";
    })();

    try {
      localStorage.setItem(section.storageKey, pathname + cleanSearch);
    } catch {
      // localStorage unavailable (private mode etc.) — ignore
    }
  }, [pathname, search]);

  return null;
}
