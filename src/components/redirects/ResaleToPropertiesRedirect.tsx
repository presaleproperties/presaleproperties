import { Navigate, useLocation } from "react-router-dom";
import NotFound from "@/pages/NotFound";

/**
 * Redirect component for legacy /resale/* URLs to new /properties/* URLs
 * This ensures SEO value is preserved via 301 redirects
 * 
 * Handles:
 * - URLs with 'undefined' segments → render 404 inline
 * - URLs with spaces in city names → normalize to hyphens
 * - Type normalization: townhomes→townhouses, homes→city page
 * - Empty segments → clean them up
 * - /resale/{numericId} → /properties/{numericId} (single hop, not double redirect)
 */

// Map legacy resale type slugs to current /properties/ route slugs
const TYPE_MAP: Record<string, string> = {
  "townhomes": "townhouses",   // /resale/{city}/townhomes → /properties/{city}/townhouses
  "homes": "",                  // /resale/{city}/homes → /properties/{city} (no 'homes' route)
};

function slugify(str: string): string {
  return str.trim().toLowerCase().replace(/\s+/g, '-');
}

export function ResaleToPropertiesRedirect() {
  const location = useLocation();
  
  // Check for malformed URLs with 'undefined' segments
  if (location.pathname.includes('/undefined')) {
    return <NotFound />;
  }
  
  // Extract the raw segment after /resale/
  const rawSegment = location.pathname.replace(/^\/resale\/?/, '').split('/')[0] || '';

  // Numeric-only ID (e.g. /resale/29225634) → /properties/29225634 directly
  // ResaleListingDetail already handles the second hop to the canonical address URL
  if (/^\d+$/.test(rawSegment)) {
    return <Navigate to={`/properties/${rawSegment}`} replace />;
  }
  
  // Split path into segments, normalize each
  const segments = location.pathname
    .replace(/^\/resale\/?/, '')  // Remove /resale prefix
    .split('/')
    .filter(Boolean)
    .map(seg => slugify(decodeURIComponent(seg)));
  
  // Normalize type segment if present (2nd or 3rd segment)
  // Patterns: /resale/{city}/{type} or /resale/{city}/{neighborhood}/{type}
  for (let i = 1; i < segments.length; i++) {
    const mapped = TYPE_MAP[segments[i]];
    if (mapped !== undefined) {
      if (mapped === "") {
        // Remove this segment (e.g., 'homes' → just go to city page)
        segments.splice(i, 1);
        i--;
      } else {
        segments[i] = mapped;
      }
    }
  }
  
  const newPath = `/properties${segments.length > 0 ? '/' + segments.join('/') : ''}`;
  const newUrl = `${newPath}${location.search}${location.hash}`;
  
  return <Navigate to={newUrl} replace />;
}
