import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Safety net for Radix UI scroll-lock attribute.
 *
 * Radix dialogs/popovers/sheets set `data-scroll-locked` on <body> while open.
 * If a dialog crashes, navigates away, or unmounts mid-animation without
 * properly cleaning up, the attribute can stick — leaving the page with
 * `overflow: hidden !important` and the user unable to scroll.
 *
 * This component clears any stale lock when:
 *   1. The route changes (most common cause of stuck state)
 *   2. The user actively scrolls/touches (defensive — if no Radix overlay
 *      is actually present, we know the lock is stale)
 */
export function ScrollLockSafety() {
  const location = useLocation();

  // Clear stale lock on every route change
  useEffect(() => {
    const body = document.body;
    if (!body.hasAttribute("data-scroll-locked")) return;

    // Defer one tick so legitimate dialogs that open during navigation
    // (rare) still get to set the attribute themselves.
    const t = setTimeout(() => {
      const hasOpenOverlay = document.querySelector(
        '[role="dialog"][data-state="open"], [data-radix-popper-content-wrapper], [role="alertdialog"][data-state="open"]'
      );
      if (!hasOpenOverlay) {
        body.removeAttribute("data-scroll-locked");
        body.style.removeProperty("overflow");
        body.style.removeProperty("padding-right");
      }
    }, 50);

    return () => clearTimeout(t);
  }, [location.pathname]);

  // Defensive: if user touches/scrolls and there's no overlay, clear the lock
  useEffect(() => {
    const checkAndClear = () => {
      const body = document.body;
      if (!body.hasAttribute("data-scroll-locked")) return;
      const hasOpenOverlay = document.querySelector(
        '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]'
      );
      if (!hasOpenOverlay) {
        body.removeAttribute("data-scroll-locked");
        body.style.removeProperty("overflow");
        body.style.removeProperty("padding-right");
      }
    };

    window.addEventListener("touchstart", checkAndClear, { passive: true });
    return () => {
      window.removeEventListener("touchstart", checkAndClear);
    };
  }, []);

  return null;
}
