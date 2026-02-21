import { Navigate, useLocation } from "react-router-dom";
import NotFound from "@/pages/NotFound";

/**
 * Catch-all redirect for /properties/* URLs that contain spaces or 'undefined'.
 * Normalizes spaces to hyphens so Google-crawled URLs like
 * /properties/new westminster → /properties/new-westminster
 * /properties/delta/north-delta/undefined → 404
 */
export function PropertiesCleanupRedirect() {
  const location = useLocation();
  const decoded = decodeURIComponent(location.pathname);
  
  // 404 for undefined segments
  if (decoded.includes('/undefined')) {
    return <NotFound />;
  }
  
  // Normalize spaces to hyphens
  const cleaned = decoded.replace(/\s+/g, '-').toLowerCase();
  
  if (cleaned !== decoded) {
    return <Navigate to={`${cleaned}${location.search}${location.hash}`} replace />;
  }
  
  // If nothing changed, this shouldn't have matched — show 404
  return <NotFound />;
}
