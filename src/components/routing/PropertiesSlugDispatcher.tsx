import { lazy, Suspense } from "react";
import { useParams, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const CityResalePage = lazy(() => import("@/pages/CityResalePage"));
const ResaleListingDetail = lazy(() => import("@/pages/ResaleListingDetail"));

/**
 * Known city slugs that should route to CityResalePage.
 * When adding a new city, add its slug here AND in CityResalePage's CITY_CONFIG.
 */
const CITY_SLUGS = new Set([
  "vancouver", "surrey", "coquitlam", "burnaby", "delta",
  "langley", "abbotsford", "chilliwack", "richmond",
  "new-westminster", "port-coquitlam", "port-moody",
  "white-rock", "north-vancouver", "maple-ridge", "west-vancouver",
  "pitt-meadows", "mission",
]);

/**
 * Dispatcher for /properties/:slug
 * Determines if the slug is a city page or a listing detail page.
 * Guards against undefined, empty, or malformed slugs.
 */
export function PropertiesSlugDispatcher() {
  const { slug } = useParams<{ slug: string }>();

  // Guard: missing or empty slug → redirect to /properties
  if (!slug || slug.trim() === "" || slug === "undefined" || slug === "null") {
    return <Navigate to="/properties" replace />;
  }

  // Decode URI-encoded slugs to handle special characters
  let decodedSlug: string;
  try {
    decodedSlug = decodeURIComponent(slug);
  } catch {
    decodedSlug = slug;
  }

  const isCity = CITY_SLUGS.has(decodedSlug.toLowerCase());

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      {isCity ? <CityResalePage /> : <ResaleListingDetail />}
    </Suspense>
  );
}
