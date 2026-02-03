import { Navigate, useParams, useLocation } from "react-router-dom";

/**
 * SEO Redirect Components for Presale URL Migration
 * 
 * Redirects legacy URL patterns to new SEO-friendly structure:
 * 
 * OLD: /{city}-presale-condos → NEW: /presale-projects/{city}/condos
 * OLD: /{city}-presale-townhomes → NEW: /presale-projects/{city}/townhomes
 * OLD: /presale-condos-under-{price}k-{city} → NEW: /presale-projects/{city}/condos-under-{price}k
 * OLD: /presale-townhomes-under-{price}k-{city} → NEW: /presale-projects/{city}/townhomes-under-{price}k
 * 
 * These use replace={true} for 301-style permanent redirects (React Router handles this client-side)
 */

// Map of supported cities for URL validation
const SUPPORTED_CITIES = [
  "vancouver", "surrey", "burnaby", "richmond", "langley", 
  "coquitlam", "delta", "abbotsford", "port-coquitlam", "port-moody",
  "new-westminster", "north-vancouver", "white-rock", "maple-ridge", "chilliwack"
];

/**
 * Redirect /{city}-presale-condos to /presale-projects/{city}/condos
 */
export function LegacyCityCondosRedirect() {
  const location = useLocation();
  const pathname = location.pathname;
  
  // Extract city from URL pattern: /{city}-presale-condos
  const match = pathname.match(/^\/([a-z-]+)-presale-condos$/);
  
  if (!match) {
    return <Navigate to="/presale-projects" replace />;
  }
  
  const citySlug = match[1];
  
  if (!SUPPORTED_CITIES.includes(citySlug)) {
    return <Navigate to="/presale-projects" replace />;
  }
  
  // Redirect to new URL structure
  return <Navigate to={`/presale-projects/${citySlug}/condos`} replace />;
}

/**
 * Redirect /{city}-presale-townhomes to /presale-projects/{city}/townhomes
 */
export function LegacyCityTownhomesRedirect() {
  const location = useLocation();
  const pathname = location.pathname;
  
  // Extract city from URL pattern: /{city}-presale-townhomes
  const match = pathname.match(/^\/([a-z-]+)-presale-townhomes$/);
  
  if (!match) {
    return <Navigate to="/presale-projects" replace />;
  }
  
  const citySlug = match[1];
  
  if (!SUPPORTED_CITIES.includes(citySlug)) {
    return <Navigate to="/presale-projects" replace />;
  }
  
  // Redirect to new URL structure
  return <Navigate to={`/presale-projects/${citySlug}/townhomes`} replace />;
}

/**
 * Redirect /presale-condos-under-{price}k-{city} to /presale-projects/{city}/condos-under-{price}k
 */
export function LegacyPriceCondosRedirect() {
  const { pricePoint, citySlug } = useParams<{ pricePoint: string; citySlug: string }>();
  
  if (!pricePoint || !citySlug) {
    return <Navigate to="/presale-projects" replace />;
  }
  
  // Redirect to new URL structure
  return <Navigate to={`/presale-projects/${citySlug}/condos-under-${pricePoint}`} replace />;
}

/**
 * Redirect /presale-townhomes-under-{price}k-{city} to /presale-projects/{city}/townhomes-under-{price}k
 */
export function LegacyPriceTownhomesRedirect() {
  const { pricePoint, citySlug } = useParams<{ pricePoint: string; citySlug: string }>();
  
  if (!pricePoint || !citySlug) {
    return <Navigate to="/presale-projects" replace />;
  }
  
  // Redirect to new URL structure
  return <Navigate to={`/presale-projects/${citySlug}/townhomes-under-${pricePoint}`} replace />;
}

/**
 * Updated CityPresaleSEORedirect for /presale-condos/:citySlug pattern
 * Redirects to /presale-projects/{city}/condos
 */
export function LegacyPresaleCondosCityRedirect() {
  const { citySlug } = useParams<{ citySlug: string }>();
  
  if (!citySlug) {
    return <Navigate to="/presale-projects" replace />;
  }
  
  // Redirect to new URL structure
  return <Navigate to={`/presale-projects/${citySlug}/condos`} replace />;
}
