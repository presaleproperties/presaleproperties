import { useLocation, useSearchParams } from "react-router-dom";
import { useSeoRobots } from "@/hooks/useSeoRobots";
import { useHelmet } from "@/hooks/useHelmet";

const SITE_URL = "https://presaleproperties.com";

/**
 * Global SEO Component
 * 
 * Handles site-wide SEO concerns:
 * 1. Canonical URLs - Every page gets an explicit canonical (prevents "duplicate without canonical")
 * 2. Robots meta - Tight noindex only for truly non-indexable pages
 * 3. Googlebot specific directives for map/coordinate URLs
 * 
 * Individual pages override these with their own Helmet tags (later Helmet tags win).
 * This base layer ensures ZERO pages are missing a canonical tag.
 */
export function GlobalSEO() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { noindex, canonicalUrl } = useSeoRobots();
  
  // Always produce a clean path — no trailing slashes, no query strings
  const cleanPath = location.pathname.replace(/\/+$/, '') || '/';
  
  // canonicalUrl from useSeoRobots already handles filter→clean page mapping.
  // For non-filter pages it equals SITE_URL + cleanPath (self-referencing).
  // This ensures EVERY page has an explicit canonical — fixing "duplicate without canonical".
  const effectiveCanonicalUrl = canonicalUrl || `${SITE_URL}${cleanPath}`;
  
  // Robots directive — index by default, only block truly non-indexable pages
  const robotsContent = noindex 
    ? "noindex, follow" 
    : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

  useHelmet({
    canonical: effectiveCanonicalUrl,
    robots: robotsContent,
    metaTags:
      searchParams.has("lat") || searchParams.has("lng") || searchParams.has("zoom") || searchParams.has("mode")
        ? [{ name: "googlebot", content: "noindex, follow" }]
        : [],
  });

  return null;
}
