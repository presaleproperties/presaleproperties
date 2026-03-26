import { useState, useEffect, lazy, Suspense, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Map, MapPin, ArrowRight, Building2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { SafeMapWrapper } from "@/components/map/SafeMapWrapper";
import { useEnabledCities } from "@/hooks/useEnabledCities";
import { cn } from "@/lib/utils";

// Lazy load the combined map component
const CombinedListingsMap = lazy(() => 
  import("@/components/map/CombinedListingsMap").then(m => ({ default: m.CombinedListingsMap }))
);

type MapMode = "all" | "presale" | "resale";

interface MLSListingForMap {
  id: string;
  listing_key: string;
  listing_price: number;
  list_date?: string | null;
  city: string;
  neighborhood?: string | null;
  street_number?: string | null;
  street_name?: string | null;
  property_type?: string | null;
  property_sub_type?: string | null;
  bedrooms_total?: number | null;
  bathrooms_total?: number | null;
  living_area?: number | null;
  latitude: number | null;
  longitude: number | null;
  photos?: any | null;
  mls_status?: string | null;
  year_built?: number | null;
  list_agent_name?: string | null;
  list_office_name?: string | null;
}

interface PresaleProjectForMap {
  id: string;
  name: string;
  slug: string;
  city: string;
  neighborhood?: string | null;
  status?: string | null;
  project_type?: string | null;
  starting_price?: number | null;
  featured_image?: string | null;
  map_lat: number | null;
  map_lng: number | null;
}

interface HomeUnifiedMapSectionProps {
  /** Initial mode for the map - defaults to "all" */
  initialMode?: MapMode;
  /** Default heading based on context */
  contextType?: "presale" | "resale" | "home";
  /** Optional: Pass external resale listings to show on map (bypasses internal fetch) */
  externalResaleListings?: MLSListingForMap[];
  /** Optional: Pass external presale projects to show on map (bypasses internal fetch) */
  externalPresaleProjects?: PresaleProjectForMap[];
  /** City name for map link context */
  cityContext?: string;
  /** Custom heading override */
  customHeading?: string;
}

export function HomeUnifiedMapSection({ 
  initialMode = "all",
  contextType = "home",
  externalResaleListings,
  externalPresaleProjects,
  cityContext,
  customHeading
}: HomeUnifiedMapSectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [mode, setMode] = useState<MapMode>(initialMode);
  const sectionRef = useRef<HTMLElement>(null);

  // Get enabled cities from admin settings
  const { data: enabledCities } = useEnabledCities();

  // Intersection Observer — only gates Leaflet DOM init, NOT data fetching
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "600px", threshold: 0.01 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Metro Vancouver cities fallback
  const metroVancouverCities = [
    "Vancouver", "Surrey", "Burnaby", "Richmond", "Langley",
    "Coquitlam", "Delta", "Abbotsford", "New Westminster",
    "Port Coquitlam", "Port Moody", "Maple Ridge", "White Rock",
    "North Vancouver", "West Vancouver", "Chilliwack", "Mission"
  ];

  // Only fetch if no external data provided
  const useExternalData = externalResaleListings !== undefined || externalPresaleProjects !== undefined;

  const citiesToUse = cityContext
    ? [cityContext]
    : (enabledCities && enabledCities.length > 0 ? enabledCities : metroVancouverCities);

  // Fetch presale projects immediately — don't gate behind intersection observer
  const { data: presaleProjects, isLoading: presaleLoading } = useQuery({
    queryKey: ["unified-map-presale-projects-v2", cityContext],
    queryFn: async () => {
      let query = supabase
        .from("presale_projects")
        .select("id, name, slug, city, neighborhood, status, project_type, starting_price, featured_image, map_lat, map_lng")
        .eq("is_published", true)
        .not("status", "eq", "sold_out")
        .not("map_lat", "is", null)
        .not("map_lng", "is", null);
      if (cityContext) query = query.ilike("city", cityContext);
      query = query.order("is_featured", { ascending: false }).limit(200);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !externalPresaleProjects,
    staleTime: 10 * 60 * 1000, // 10 min — stable presale data
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Fetch resale listings — single 1000-row request, lean fields, immediate fetch
  const { data: resaleListings, isLoading: resaleLoading } = useQuery({
    queryKey: ["unified-map-resale-v5", citiesToUse.slice().sort().join(","), cityContext],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mls_listings_safe")
        .select("id, listing_key, listing_price, list_date, city, neighborhood, street_number, street_name, property_type, property_sub_type, bedrooms_total, bathrooms_total, living_area, latitude, longitude, photos, mls_status, year_built, list_agent_name, list_office_name")
        .eq("mls_status", "Active")
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .in("city", citiesToUse)
        .gte("year_built", 2024)
        .gte("latitude", 48.9)
        .lte("latitude", 49.6)
        .gte("longitude", -123.35)
        .lte("longitude", -121.7)
        .order("list_date", { ascending: false, nullsFirst: false })
        .limit(1000); // 1000 is plenty for a homepage map section
      if (error) throw error;
      return data || [];
    },
    enabled: !externalResaleListings,
    staleTime: 10 * 60 * 1000, // 10 min cache — avoids refetch on back nav
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Use external data if provided, otherwise use fetched data
  const finalResaleListings = externalResaleListings ?? resaleListings ?? [];
  const finalPresaleProjects = externalPresaleProjects ?? presaleProjects ?? [];

  // Dynamic heading based on mode (can be overridden by customHeading)
  const getHeading = () => {
    if (customHeading) return customHeading;
    const cityPrefix = cityContext ? `${cityContext} ` : "";
    switch (mode) {
      case "presale":
        return `Explore ${cityPrefix}Presale Projects`;
      case "resale":
        return `Explore ${cityPrefix}Move-In Ready Homes`;
      default:
        return `Explore ${cityPrefix}Properties`;
    }
  };

  const getSubheading = () => {
    const cityText = cityContext ? `in ${cityContext}` : "near you";
    switch (mode) {
      case "presale":
        return `Find presale condos and townhomes ${cityText}. Click any pin for details.`;
      case "resale":
        return `Find brand new homes ready for move-in ${cityText}. Click any pin for details.`;
      default:
        return `Browse presale projects and move-in ready homes ${cityText}. Click any pin for details.`;
    }
  };

  const getFullMapLink = () => {
    const cityParam = cityContext ? `&city=${encodeURIComponent(cityContext)}` : "";
    switch (mode) {
      case "presale":
        return `/map-search?mode=presale${cityParam}`;
      case "resale":
        return `/map-search?mode=resale${cityParam}`;
      default:
        return `/map-search${cityParam ? `?${cityParam.substring(1)}` : ""}`;
    }
  };

  const LoadingPlaceholder = () => (
    <div className="h-[450px] md:h-[550px] lg:h-[600px] rounded-xl bg-muted animate-pulse flex items-center justify-center">
      <div className="text-center text-muted-foreground">
        <Map className="h-12 w-12 mx-auto mb-2 animate-pulse" />
        <p>Loading map...</p>
      </div>
    </div>
  );

  return (
    <section 
      ref={sectionRef}
      className="py-12 md:py-16 lg:py-20 bg-muted/30 relative z-0"
    >
      <div className="container px-4">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6 md:mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary uppercase tracking-wider">
                Interactive Map
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">
              {getHeading()}
            </h2>
            <p className="text-muted-foreground mt-2 text-sm md:text-base max-w-xl">
              {getSubheading()}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Inline Mode Toggle - Does NOT navigate */}
            <div className="flex items-center gap-1 p-1 bg-muted rounded-full">
              <button
                onClick={() => setMode("all")}
                className={cn(
                  "flex items-center gap-1.5 rounded-full font-medium transition-all px-3 py-1.5 text-xs",
                  mode === "all"
                    ? "bg-foreground text-background shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                All
              </button>
              <button
                onClick={() => setMode("presale")}
                className={cn(
                  "flex items-center gap-1.5 rounded-full font-medium transition-all px-3 py-1.5 text-xs",
                  mode === "presale"
                    ? "bg-foreground text-background shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Building2 className="h-3 w-3" />
                Presale
              </button>
              <button
                onClick={() => setMode("resale")}
                className={cn(
                  "flex items-center gap-1.5 rounded-full font-medium transition-all px-3 py-1.5 text-xs",
                  mode === "resale"
                    ? "bg-foreground text-background shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Home className="h-3 w-3" />
                Move-In Ready
              </button>
            </div>
            <Link to={getFullMapLink()}>
              <Button variant="outline" className="gap-2" size="sm">
                <Map className="h-4 w-4" />
                Full Map
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Map Container — show skeleton only until section is visible; map renders immediately once in viewport */}
        {!isVisible ? (
          <LoadingPlaceholder />
        ) : (
          <SafeMapWrapper height="h-[450px] md:h-[550px] lg:h-[600px]">
            <Suspense fallback={<LoadingPlaceholder />}>
              <div className="h-[450px] md:h-[550px] lg:h-[600px] rounded-xl overflow-hidden border border-border">
                <CombinedListingsMap 
                  resaleListings={finalResaleListings as any}
                  presaleProjects={finalPresaleProjects as any}
                  mode={mode}
                />
              </div>
            </Suspense>
          </SafeMapWrapper>
        )}

        {/* Legend */}
        {hasData && mode === "all" && (
          <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ background: "hsl(30, 15%, 18%)", border: "2px solid hsl(40, 65%, 55%)" }} />
              <span>Presale Projects</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ background: "hsl(40, 65%, 55%)", border: "2px solid white" }} />
              <span>Move-In Ready</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
