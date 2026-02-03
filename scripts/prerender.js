/**
 * Prerender Script for Static HTML Generation
 * 
 * This script generates static HTML snapshots of key pages for SEO.
 * Run after build: node scripts/prerender.js
 * 
 * Note: This requires a production build first (npm run build)
 * and uses puppeteer to render pages and capture HTML.
 */

// Metro Vancouver cities for programmatic SEO
const PROGRAMMATIC_CITIES = [
  "vancouver", "surrey", "burnaby", "coquitlam", "langley", "richmond",
  "delta", "abbotsford", "north-vancouver", "new-westminster", 
  "port-moody", "port-coquitlam", "maple-ridge", "white-rock"
];

const PROPERTY_TYPES = ["condos", "townhomes"];
const PRICE_POINTS = ["500k", "600k", "700k", "800k", "900k", "1m"];

// Generate programmatic SEO routes
const programmaticRoutes = [];

// City hub pages: /presale-projects/{city}
PROGRAMMATIC_CITIES.forEach(city => {
  programmaticRoutes.push(`/presale-projects/${city}`);
  
  // City + Type pages: /presale-projects/{city}/condos
  PROPERTY_TYPES.forEach(type => {
    programmaticRoutes.push(`/presale-projects/${city}/${type}`);
    
    // City + Type + Price pages: /presale-projects/{city}/condos-under-500k
    PRICE_POINTS.forEach(price => {
      programmaticRoutes.push(`/presale-projects/${city}/${type}-under-${price}`);
    });
  });
});

const ROUTES_TO_PRERENDER = [
  // Primary pages
  "/",
  "/properties",
  "/presale-projects",
  "/assignments",
  "/calculator",
  "/contact",
  "/about",
  "/blog",
  "/developers",
  "/buyers-guide",
  "/presale-guide",
  "/for-agents",
  "/for-developers",
  
  // Neighborhood presale pages (legacy - kept for SEO equity)
  "/burnaby-brentwood-presale",
  "/burnaby-metrotown-presale",
  "/surrey-cloverdale-presale",
  "/south-surrey-presale",
  "/langley-willoughby-presale",
  "/surrey-city-centre-presale",
  "/coquitlam-burquitlam-presale",
  "/vancouver-mount-pleasant-presale",
  "/richmond-brighouse-presale",
  "/north-vancouver-lonsdale-presale",
  "/new-westminster-downtown-presale",
  "/maple-ridge-town-centre-presale",
  
  // Legacy city presale pages (redirects to new structure)
  "/vancouver-presale-condos",
  "/vancouver-presale-townhomes",
  "/surrey-presale-condos",
  "/surrey-presale-townhomes",
  "/burnaby-presale-condos",
  "/burnaby-presale-townhomes",
  "/coquitlam-presale-condos",
  "/coquitlam-presale-townhomes",
  "/langley-presale-condos",
  "/langley-presale-townhomes",
  "/richmond-presale-condos",
  "/richmond-presale-townhomes",
  "/delta-presale-condos",
  "/delta-presale-townhomes",
  "/abbotsford-presale-condos",
  "/abbotsford-presale-townhomes",
  
  // Properties city pages
  "/properties/vancouver",
  "/properties/surrey",
  "/properties/burnaby",
  "/properties/coquitlam",
  "/properties/langley",
  "/properties/richmond",
  "/properties/delta",
  "/properties/abbotsford",
  "/properties/north-vancouver",
  "/properties/new-westminster",
  "/properties/port-moody",
  "/properties/maple-ridge",
  "/properties/popular-searches",
  
  // NEW: Programmatic SEO pages (City × Type × Price)
  ...programmaticRoutes,
];

const programmaticTotal = PROGRAMMATIC_CITIES.length * (1 + PROPERTY_TYPES.length + (PROPERTY_TYPES.length * PRICE_POINTS.length));

console.log(`
===========================================
PRERENDER CONFIGURATION
===========================================

Programmatic SEO Routes Generated:
  - City Hub Pages (/presale-projects/{city}): ${PROGRAMMATIC_CITIES.length}
  - City + Type Pages: ${PROGRAMMATIC_CITIES.length * PROPERTY_TYPES.length}
  - City + Type + Price Pages: ${PROGRAMMATIC_CITIES.length * PROPERTY_TYPES.length * PRICE_POINTS.length}
  - Total Programmatic: ${programmaticTotal}

Total routes configured: ${ROUTES_TO_PRERENDER.length}

URL Structure:
  /presale-projects/{city}
  /presale-projects/{city}/{type}
  /presale-projects/{city}/{type}-under-{price}

To implement full prerendering:
1. Install puppeteer: npm install puppeteer --save-dev
2. Build the project: npm run build
3. Serve the build locally
4. Use puppeteer to crawl and save HTML

For Lovable deployments, the react-helmet-async 
meta tags provide SEO benefits even without 
full prerendering, as Googlebot can execute JavaScript.

===========================================
`);

// Export routes for programmatic access
module.exports = { ROUTES_TO_PRERENDER, PROGRAMMATIC_CITIES, PROPERTY_TYPES, PRICE_POINTS };
