import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getVisitorId } from "@/lib/tracking/identifiers";

interface DeckTrackingConfig {
  slug: string;
  projectName: string;
  projectId?: string | null;
  deckId?: string;
  /** Sections to observe — must match element IDs in the DOM */
  sectionIds: string[];
}

/**
 * Tracks which pitch deck sections a lead scrolls into view.
 * Logs one `client_activity` row per section per session (deduped via Set).
 * Fires after 1.5s of 40%+ visibility to filter drive-by scrolls.
 */
export function useDeckSectionTracking({
  slug,
  projectName,
  projectId,
  deckId,
  sectionIds,
}: DeckTrackingConfig) {
  const loggedSections = useRef(new Set<string>());

  const logSectionView = useCallback(
    async (sectionId: string) => {
      if (loggedSections.current.has(sectionId)) return;
      loggedSections.current.add(sectionId);

      const visitorId = getVisitorId();
      const leadEmail = localStorage.getItem(`deck_lead_email_${slug}`) || undefined;

      try {
        await (supabase as any).from("client_activity").insert({
          activity_type: "deck_section_view",
          visitor_id: visitorId || undefined,
          project_id: projectId || undefined,
          project_name: projectName,
          page_url: window.location.href,
          page_title: `Deck: ${projectName} — ${sectionId}`,
          session_id: sessionStorage.getItem("pp_session_id") || undefined,
          device_type: /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop",
          referrer: document.referrer || undefined,
          // Store section + deck metadata in city field as compact label
          city: sectionId,
        });
      } catch {
        // Non-critical — don't break the UX
      }
    },
    [slug, projectName, projectId]
  );

  useEffect(() => {
    if (!slug || sectionIds.length === 0) return;

    const timers = new Map<string, ReturnType<typeof setTimeout>>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.id;
          if (entry.isIntersecting) {
            // Wait 1.5s of visibility before logging
            if (!timers.has(id)) {
              timers.set(
                id,
                setTimeout(() => {
                  logSectionView(id);
                  timers.delete(id);
                }, 1500)
              );
            }
          } else {
            // Scrolled away before threshold — cancel
            const timer = timers.get(id);
            if (timer) {
              clearTimeout(timer);
              timers.delete(id);
            }
          }
        });
      },
      { threshold: 0.4 }
    );

    // Observe after a tick to ensure DOM is ready
    const raf = requestAnimationFrame(() => {
      sectionIds.forEach((id) => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      });
    });

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, [slug, sectionIds, logSectionView]);
}
