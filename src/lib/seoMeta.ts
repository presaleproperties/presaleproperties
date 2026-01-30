/**
 * SEO Meta Template System
 * 
 * Implements PART 6 — TITLE & META TEMPLATE SYSTEM
 * Dynamic, CTR-optimized title and description generation.
 * 
 * CTR Optimization Guidelines:
 * - Include price in title (increases CTR by 20%+)
 * - Use current year (signals freshness)
 * - Include count of listings (social proof)
 * - Power words: "VIP", "Exclusive", "New", "Just Listed"
 * - Keep titles under 60 chars, descriptions under 160 chars
 */

const CURRENT_YEAR = new Date().getFullYear();

// ============================================
// Homepage
// ============================================

export const getHomepageMeta = () => ({
  title: `Vancouver Presale Condos & Townhomes ${CURRENT_YEAR} | From $299K`,
  description: "100+ presale condos & new construction in Vancouver, Surrey, Langley, Burnaby. VIP pricing, floor plans & deposit structures. Get exclusive early access.",
  keywords: "Vancouver presale condos, Surrey presale townhomes, Langley new construction, presale investment Vancouver, new condos Surrey",
});

// ============================================
// City Pages (Primary Ranking Pages)
// ============================================

export const getCityPageMeta = (
  city: string, 
  propertyType: "condos" | "townhomes",
  startingPrice?: number,
  projectCount?: number
) => {
  const priceStr = startingPrice 
    ? `From $${Math.round(startingPrice / 1000)}K` 
    : "";
  
  const projectStr = projectCount && projectCount > 0 
    ? `${projectCount}+ ` 
    : "";
  
  // CTR-optimized title with price and year
  const title = startingPrice
    ? `${city} Presale ${capitalizeFirst(propertyType)} ${priceStr} | VIP Access ${CURRENT_YEAR}`
    : `${city} Presale ${capitalizeFirst(propertyType)} | New Construction ${CURRENT_YEAR}`;
  
  // Description with count and call-to-action
  const description = `Browse ${projectStr}presale ${propertyType} in ${city}, BC. Floor plans, VIP pricing & deposit incentives. Never lived in, full warranty.`;
  
  const keywords = `${city} presale ${propertyType}, ${city} new construction, ${city} pre construction homes, ${city} new condos ${CURRENT_YEAR}`;
  
  return { title, description, keywords };
};

// ============================================
// Project Pages (High Value)
// ============================================

export const getProjectPageMeta = (
  projectName: string,
  city: string,
  neighborhood?: string,
  startingPrice?: number,
  projectType: "condo" | "townhome" | "mixed" = "condo"
) => {
  const location = neighborhood ? `${neighborhood}, ${city}` : city;
  const priceStr = startingPrice 
    ? ` from $${Math.round(startingPrice / 1000)}K` 
    : "";
  
  const typeLabel = projectType === "townhome" ? "Townhomes" : "Condos";
  
  const title = `${projectName} Presale ${typeLabel} in ${city}${priceStr} | Pricing & Floor Plans`;
  
  const description = `Discover ${projectName}, a new presale ${projectType} project in ${location}. See prices, deposit structure, floor plans, and availability. VIP access available.`;
  
  const keywords = `${projectName}, ${projectName} presale, ${projectName} ${city}, ${city} presale ${projectType}, ${neighborhood || city} new construction`;
  
  return { title, description, keywords };
};

// ============================================
// Neighborhood Pages
// ============================================

export const getNeighborhoodPageMeta = (
  city: string,
  neighborhood: string,
  propertyType: "condos" | "townhomes" | "homes",
  projectCount?: number
) => {
  const countStr = projectCount ? `${projectCount}+ ` : "";
  
  const title = `${neighborhood} Presale ${capitalizeFirst(propertyType)} | ${city} New Construction (${CURRENT_YEAR})`;
  
  const description = `Browse ${countStr}presale ${propertyType} in ${neighborhood}, ${city}. Compare floor plans, pricing, and VIP incentives for new construction homes.`;
  
  const keywords = `${neighborhood} presale ${propertyType}, ${neighborhood} ${city} new construction, ${neighborhood} new condos`;
  
  return { title, description, keywords };
};

// ============================================
// Properties/Resale Pages
// ============================================

export const getPropertiesPageMeta = (city: string, listingCount?: number) => {
  const countStr = listingCount ? `${listingCount}+ ` : "";
  
  const title = `${city} Homes for Sale | ${countStr}New & Resale Properties (${CURRENT_YEAR})`;
  
  const description = `Browse ${countStr}homes for sale in ${city}, BC. Find condos, townhomes, and houses with photos, pricing, and virtual tours.`;
  
  const keywords = `${city} homes for sale, ${city} real estate, ${city} condos for sale, ${city} houses`;
  
  return { title, description, keywords };
};

// ============================================
// Listing Detail Page
// ============================================

export const getListingPageMeta = (
  address: string,
  city: string,
  price: number,
  beds: number,
  baths: number,
  propertyType: string,
  yearBuilt?: number
) => {
  const isNew = yearBuilt && yearBuilt >= CURRENT_YEAR - 2;
  const newPrefix = isNew ? "NEW " : "";
  
  const priceStr = price >= 1000000 
    ? `$${(price / 1000000).toFixed(2)}M` 
    : `$${Math.round(price / 1000)}K`;
  
  const title = `${newPrefix}${address} | ${beds}BR ${propertyType} ${priceStr} | ${city}`;
  
  const description = `${newPrefix}${beds} bedroom, ${baths} bathroom ${propertyType.toLowerCase()} at ${address}, ${city}. Listed at ${priceStr}.${isNew ? " Brand new construction." : ""} View photos, floor plan, and schedule a tour.`;
  
  const keywords = `${address}, ${city} ${propertyType.toLowerCase()}, ${city} homes for sale, ${beds} bedroom ${city}`;
  
  return { title, description, keywords };
};

// ============================================
// Blog Pages
// ============================================

export const getBlogPageMeta = (
  title: string,
  excerpt?: string,
  category?: string
) => {
  const optimizedTitle = title.length > 50 
    ? `${title.substring(0, 47)}... | PresaleProperties`
    : `${title} | PresaleProperties`;
  
  const description = excerpt 
    || `Read about ${title.toLowerCase()} and more real estate insights on the PresaleProperties blog.`;
  
  const keywords = category 
    ? `${category.toLowerCase()}, ${title.toLowerCase()}, BC real estate, presale advice`
    : `${title.toLowerCase()}, BC real estate, presale advice`;
  
  return { title: optimizedTitle, description, keywords };
};

// ============================================
// Utility Functions
// ============================================

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format price for display in meta tags
 */
export function formatMetaPrice(price: number): string {
  if (price >= 1000000) {
    return `$${(price / 1000000).toFixed(1)}M`;
  }
  return `$${Math.round(price / 1000)}K`;
}

/**
 * Get current year for meta tags
 */
export function getCurrentYear(): number {
  return CURRENT_YEAR;
}
