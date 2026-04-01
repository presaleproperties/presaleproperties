import { lazy, Suspense } from "react";
import { useParams } from "react-router-dom";
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
 */
export function PropertiesSlugDispatcher() {
  const { slug } = useParams<{ slug: string }>();

  if (!slug) return null;

  const isCity = CITY_SLUGS.has(slug.toLowerCase());

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
