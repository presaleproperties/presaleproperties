import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Routes to prerender for SEO
// NOTE: /map-search is EXCLUDED (noindex page)

// Metro Vancouver cities for programmatic SEO
const PROGRAMMATIC_CITIES = [
  "vancouver", "surrey", "burnaby", "coquitlam", "langley", "richmond",
  "delta", "abbotsford", "north-vancouver", "new-westminster", 
  "port-moody", "port-coquitlam", "maple-ridge", "white-rock"
];

const PROPERTY_TYPES = ["condos", "townhomes"];
const PRICE_POINTS = ["500k", "600k", "700k", "800k", "900k", "1m"];

// Generate programmatic SEO routes
const programmaticRoutes: string[] = [];

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

const prerenderRoutes = [
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
  
  // Legacy city presale pages
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
  
  // Programmatic SEO pages (City x Type x Price)
  ...programmaticRoutes,
];

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(), 
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    __PRERENDER_ROUTES__: JSON.stringify(prerenderRoutes),
  },
}));
