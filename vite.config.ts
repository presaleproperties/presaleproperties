import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Routes to prerender for SEO
const prerenderRoutes = [
  // Primary pages
  "/",
  "/resale",
  "/presale-projects",
  "/map-search",
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
  
  // Neighborhood presale pages
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
  // City presale pages
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
  
  // City resale pages  
  "/resale/vancouver",
  "/resale/surrey",
  "/resale/burnaby",
  "/resale/coquitlam",
  "/resale/langley",
  "/resale/richmond",
  "/resale/delta",
  "/resale/abbotsford",
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
  // SSG/Prerender configuration for production builds
  // Note: Actual prerendering requires additional build configuration
  // The routes above define what should be prerendered
  define: {
    __PRERENDER_ROUTES__: JSON.stringify(prerenderRoutes),
  },
}));
