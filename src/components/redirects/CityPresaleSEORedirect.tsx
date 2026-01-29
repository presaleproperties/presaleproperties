import { useParams, Navigate } from "react-router-dom";

/**
 * SEO Redirect Component for City Presale Pages
 * 
 * Redirects legacy /presale-condos/:citySlug URLs to SEO-friendly URLs:
 * /presale-condos/surrey -> /surrey-presale-condos
 * 
 * This ensures:
 * 1. Single canonical URL per city page
 * 2. 301 redirect for SEO equity transfer
 * 3. Prevents duplicate content issues
 */
export function CityPresaleSEORedirect() {
  const { citySlug } = useParams<{ citySlug: string }>();
  
  if (!citySlug) {
    return <Navigate to="/presale-projects" replace />;
  }
  
  // Redirect to SEO-friendly URL format
  const seoUrl = `/${citySlug}-presale-condos`;
  
  return <Navigate to={seoUrl} replace />;
}
