/**
 * URL utilities for resale/MLS properties
 * 
 * URL format: /properties/{city}/{neighborhood?}/{type?}
 * Examples:
 *   - /properties/vancouver
 *   - /properties/vancouver/condos
 *   - /properties/vancouver/downtown/condos
 *   - /properties/vancouver/under-500k
 *   - /properties/vancouver/2-bedroom
 *   - /properties/abc123xyz (individual listing)
 */

const DOMAIN = "https://presaleproperties.com";

/**
 * Slugify a string for URL use
 */
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/['']/g, '') // Remove apostrophes
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '') // Trim hyphens from start/end
    .replace(/-+/g, '-'); // Replace multiple hyphens with single
};

/**
 * Format city name from slug
 */
export const formatCityName = (slug: string): string => {
  return slug
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/**
 * Format neighborhood name from slug
 */
export const formatNeighborhoodName = (slug: string): string => {
  return slug
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// ============================================
// Main Properties Page URLs
// ============================================

/**
 * Get main properties page URL
 */
export const getPropertiesUrl = (): string => "/properties";

/**
 * Get city properties page URL
 * @example /properties/vancouver
 */
export const getCityPropertiesUrl = (city: string): string => {
  return `/properties/${slugify(city)}`;
};

/**
 * Get canonical URL for city properties page
 */
export const getCityPropertiesCanonicalUrl = (city: string): string => {
  return `${DOMAIN}${getCityPropertiesUrl(city)}`;
};

// ============================================
// Property Type URLs
// ============================================

/**
 * Get city property type URL
 * @example /properties/vancouver/condos
 */
export const getCityPropertyTypeUrl = (city: string, propertyType: string): string => {
  return `/properties/${slugify(city)}/${slugify(propertyType)}`;
};

/**
 * Get canonical URL for city property type page
 */
export const getCityPropertyTypeCanonicalUrl = (city: string, propertyType: string): string => {
  return `${DOMAIN}${getCityPropertyTypeUrl(city, propertyType)}`;
};

/**
 * Get neighborhood property type URL
 * @example /properties/vancouver/downtown/condos
 */
export const getNeighborhoodPropertyTypeUrl = (
  city: string, 
  neighborhood: string, 
  propertyType: string
): string => {
  return `/properties/${slugify(city)}/${slugify(neighborhood)}/${slugify(propertyType)}`;
};

/**
 * Get canonical URL for neighborhood property type page
 */
export const getNeighborhoodPropertyTypeCanonicalUrl = (
  city: string, 
  neighborhood: string, 
  propertyType: string
): string => {
  return `${DOMAIN}${getNeighborhoodPropertyTypeUrl(city, neighborhood, propertyType)}`;
};

// ============================================
// Price Range URLs
// ============================================

/**
 * Get city price range URL
 * @example /properties/vancouver/under-500k
 */
export const getCityPriceRangeUrl = (city: string, priceRange: string): string => {
  return `/properties/${slugify(city)}/${slugify(priceRange)}`;
};

/**
 * Get canonical URL for city price range page
 */
export const getCityPriceRangeCanonicalUrl = (city: string, priceRange: string): string => {
  return `${DOMAIN}${getCityPriceRangeUrl(city, priceRange)}`;
};

// ============================================
// Bedroom Count URLs
// ============================================

/**
 * Get city bedroom count URL
 * @example /properties/vancouver/2-bedroom
 */
export const getCityBedroomUrl = (city: string, bedroomSlug: string): string => {
  return `/properties/${slugify(city)}/${slugify(bedroomSlug)}`;
};

/**
 * Get canonical URL for city bedroom page
 */
export const getCityBedroomCanonicalUrl = (city: string, bedroomSlug: string): string => {
  return `${DOMAIN}${getCityBedroomUrl(city, bedroomSlug)}`;
};

// ============================================
// Individual Listing URLs
// ============================================

/**
 * Build address slug from listing data
 * @example "107-19911-76-avenue-langley"
 */
export const buildAddressSlug = (
  address: string | null | undefined,
  city: string | null | undefined
): string => {
  const parts: string[] = [];
  if (address) parts.push(address);
  if (city) parts.push(city);
  
  if (parts.length === 0) return "listing";
  
  return slugify(parts.join(" "));
};

/**
 * Get individual listing URL with address for SEO
 * @example /properties/107-19911-76-avenue-langley/29153217
 */
export const getListingUrl = (
  listingKey: string,
  address?: string | null,
  city?: string | null
): string => {
  const addressSlug = buildAddressSlug(address, city);
  return `/properties/${addressSlug}/${listingKey}`;
};

/**
 * Get canonical URL for individual listing
 */
export const getListingCanonicalUrl = (
  listingKey: string,
  address?: string | null,
  city?: string | null
): string => {
  return `${DOMAIN}${getListingUrl(listingKey, address, city)}`;
};

/**
 * Legacy listing URL (for backwards compatibility/redirects)
 * @example /properties/29153217
 */
export const getLegacyListingUrl = (listingKey: string): string => {
  return `/properties/${listingKey}`;
};

// ============================================
// URL Parsing Utilities
// ============================================

/**
 * Check if URL is a legacy /resale/* URL
 */
export const isLegacyResaleUrl = (url: string): boolean => {
  return url.startsWith('/resale');
};

/**
 * Convert legacy /resale/* URL to new /properties/* URL
 */
export const convertLegacyUrl = (url: string): string => {
  return url.replace(/^\/resale/, '/properties');
};

// ============================================
// Predefined City and Type Constants
// ============================================

export const CITIES = [
  "Vancouver",
  "Burnaby",
  "Surrey",
  "Richmond",
  "Coquitlam",
  "Langley",
  "New Westminster",
  "North Vancouver",
  "West Vancouver",
  "Port Coquitlam",
  "Port Moody",
  "Delta",
  "Abbotsford",
] as const;

export const PROPERTY_TYPES = {
  condos: { label: "Condos", filter: ["Apartment/Condo", "Apartment", "Condo"] },
  townhomes: { label: "Townhomes", filter: ["Townhouse", "Row/Townhouse", "Townhome"] },
  homes: { label: "Homes", filter: ["Single Family", "Detached", "House"] },
} as const;

export const PRICE_RANGES = [
  { slug: "under-500k", label: "Under $500K", min: 0, max: 500000 },
  { slug: "500k-750k", label: "$500K - $750K", min: 500000, max: 750000 },
  { slug: "750k-1m", label: "$750K - $1M", min: 750000, max: 1000000 },
  { slug: "1m-1.5m", label: "$1M - $1.5M", min: 1000000, max: 1500000 },
  { slug: "1.5m-2m", label: "$1.5M - $2M", min: 1500000, max: 2000000 },
  { slug: "over-2m", label: "Over $2M", min: 2000000, max: null },
] as const;

export const BEDROOM_OPTIONS = [
  { slug: "1-bedroom", label: "1 Bedroom", count: 1 },
  { slug: "2-bedroom", label: "2 Bedroom", count: 2 },
  { slug: "3-bedroom", label: "3 Bedroom", count: 3 },
  { slug: "4-bedroom", label: "4+ Bedroom", count: 4 },
] as const;

// ============================================
// URL Generation Helpers
// ============================================

/**
 * Generate all city URLs for sitemap/navigation
 */
export const getAllCityUrls = (): string[] => {
  return CITIES.map(city => getCityPropertiesUrl(city));
};

/**
 * Generate all property type URLs for a city
 */
export const getAllPropertyTypeUrls = (city: string): string[] => {
  return Object.keys(PROPERTY_TYPES).map(type => getCityPropertyTypeUrl(city, type));
};

/**
 * Generate all price range URLs for a city
 */
export const getAllPriceRangeUrls = (city: string): string[] => {
  return PRICE_RANGES.map(range => getCityPriceRangeUrl(city, range.slug));
};

/**
 * Generate all bedroom URLs for a city
 */
export const getAllBedroomUrls = (city: string): string[] => {
  return BEDROOM_OPTIONS.map(option => getCityBedroomUrl(city, option.slug));
};
