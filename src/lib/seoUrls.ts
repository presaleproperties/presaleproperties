/**
 * SEO-friendly URL utilities for presale projects
 * 
 * New URL format: /{neighborhood}-presale-{type}-{slug}
 * Examples:
 *   - /south-surrey-presale-townhomes-harlowe
 *   - /langley-presale-condos-parkside-tower
 *   - /burnaby-metrotown-presale-condos-metropolis
 */

export interface ProjectUrlParams {
  slug: string;
  neighborhood: string;
  projectType: "condo" | "townhome" | "mixed" | "duplex" | "single_family";
}

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
 * Get the URL-friendly project type label
 */
export const getProjectTypeSlug = (type: ProjectUrlParams['projectType']): string => {
  const typeMap: Record<string, string> = {
    condo: 'condos',
    townhome: 'townhomes',
    mixed: 'homes',
    duplex: 'duplexes',
    single_family: 'homes',
  };
  return typeMap[type] || 'homes';
};

/**
 * Generate SEO-friendly URL for a presale project
 * Format: /{neighborhood-slug}-presale-{type}-{project-slug}
 */
export const generateProjectUrl = (params: ProjectUrlParams): string => {
  const { slug, neighborhood, projectType } = params;
  const neighborhoodSlug = slugify(neighborhood);
  const typeSlug = getProjectTypeSlug(projectType);
  
  return `/${neighborhoodSlug}-presale-${typeSlug}-${slug}`;
};

/**
 * Generate the canonical URL for a presale project
 */
export const generateProjectCanonicalUrl = (params: ProjectUrlParams): string => {
  return `https://presaleproperties.com${generateProjectUrl(params)}`;
};

/**
 * Parse an SEO-friendly project URL to extract components
 * Returns null if URL doesn't match expected pattern
 */
export const parseProjectUrl = (url: string): { neighborhood: string; type: string; slug: string } | null => {
  // Pattern: /{neighborhood}-presale-{type}-{slug}
  const match = url.match(/^\/(.+)-presale-(condos|townhomes|homes|duplexes)-(.+)$/);
  
  if (!match) return null;
  
  return {
    neighborhood: match[1],
    type: match[2],
    slug: match[3],
  };
};

/**
 * Check if a URL is the legacy format (/presale-projects/:slug)
 */
export const isLegacyProjectUrl = (url: string): boolean => {
  return url.startsWith('/presale-projects/');
};

/**
 * Extract slug from legacy URL
 */
export const getSlugFromLegacyUrl = (url: string): string | null => {
  const match = url.match(/^\/presale-projects\/(.+)$/);
  return match ? match[1] : null;
};
