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

interface HomeUnifiedMapSectionProps {
  /** Initial mode for the map - defaults to "all" */
  initialMode?: MapMode;
  /** Default heading based on context */
  contextType?: "presale" | "resale" | "home";
}

export function HomeUnifiedMapSection({ 
  initialMode = "all",
  contextType = "home"
}: HomeUnifiedMapSectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [mode, setMode] = useState<MapMode>(initialMode);
  const sectionRef = useRef<HTMLElement>(null);

  // Get enabled cities from admin settings
  const { data: enabledCities } = useEnabledCities();

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            setTimeout(() => setShouldLoad(true), 100);
            observer.disconnect();
          }
        });
      },
      { 
        rootMargin: "200px",
        threshold: 0.1 
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Metro Vancouver cities fallback
  const metroVancouverCities = [
    "Vancouver", "Surrey", "Burnaby", "Richmond", "Langley",
    "Coquitlam", "Delta", "Abbotsford", "New Westminster",
    "Port Coquitlam", "Port Moody", "Maple Ridge", "White Rock",
    "North Vancouver", "West Vancouver", "Chilliwack", "Mission"
  ];

  // Fetch presale projects
  const { data: presaleProjects, isLoading: presaleLoading } = useQuery({
    queryKey: ["unified-map-presale-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("presale_projects")
        .select("id, name, slug, city, neighborhood, status, project_type, starting_price, featured_image, map_lat, map_lng")
        .eq("is_published", true)
        .not("status", "eq", "sold_out")
        .not("map_lat", "is", null)
        .not("map_lng", "is", null)
        .order("is_featured", { ascending: false })
        .limit(200);

      if (error) throw error;
      return data || [];
    },
    enabled: shouldLoad,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch resale listings (2025+ builds)
  const { data: resaleListings, isLoading: resaleLoading } = useQuery({
    queryKey: ["unified-map-resale-listings", enabledCities],
    queryFn: async () => {
      const citiesToUse = enabledCities && enabledCities.length > 0 ? enabledCities : metroVancouverCities;
      
      const { data, error } = await supabase
        .from("mls_listings")
        .select("id, listing_key, listing_price, city, neighborhood, street_number, street_name, property_type, property_sub_type, bedrooms_total, bathrooms_total, living_area, latitude, longitude, photos, mls_status")
        .eq("mls_status", "Active")
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .in("city", citiesToUse)
        .gte("year_built", 2025)
        .order("listing_price", { ascending: false })
        .limit(2000);

      if (error) throw error;
      return data || [];
    },
    enabled: shouldLoad,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const isLoading = presaleLoading || resaleLoading;
  const hasData = (presaleProjects?.length || 0) > 0 || (resaleListings?.length || 0) > 0;

  // Dynamic heading based on mode
  const getHeading = () => {
    switch (mode) {
      case "presale":
        return "Explore Presale Projects";
      case "resale":
        return "Explore Move-In Ready Homes";
      default:
        return "Explore All Properties";
    }
  };

  const getSubheading = () => {
    switch (mode) {
      case "presale":
        return "Find presale condos and townhomes near you. Click any pin for details.";
      case "resale":
        return "Find brand new homes ready for move-in. Click any pin for details.";
      default:
        return "Browse presale projects and move-in ready homes. Click any pin for details.";
    }
  };

  const getFullMapLink = () => {
    switch (mode) {
      case "presale":
        return "/presale-projects?view=map";
      case "resale":
        return "/resale-map";
      default:
        return "/resale-map"; // Combined map
    }
  };

  const LoadingPlaceholder = () => (
    <div className="h-[400px] lg:h-[500px] rounded-xl bg-muted animate-pulse flex items-center justify-center">
      <div className="text-center text-muted-foreground">
        <Map className="h-12 w-12 mx-auto mb-2 animate-pulse" />
        <p>Loading map...</p>
      </div>
    </div>
  );

  return (
    <section 
      ref={sectionRef}
      className="py-12 md:py-16 lg:py-20 bg-muted/30"
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

        {/* Map Container */}
        {!isVisible ? (
          <LoadingPlaceholder />
        ) : !shouldLoad || isLoading ? (
          <LoadingPlaceholder />
        ) : !hasData ? (
          <div className="h-[400px] lg:h-[500px] rounded-xl bg-muted flex items-center justify-center border border-border">
            <div className="text-center text-muted-foreground p-6">
              <Map className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <h3 className="font-semibold text-foreground mb-2">Properties Loading</h3>
              <p className="text-sm mb-4">
                Map data is being prepared. Use our search to browse properties.
              </p>
              <Link to="/presale-projects">
                <Button variant="default" size="sm">
                  Browse All Properties
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <SafeMapWrapper height="h-[400px] lg:h-[500px]">
            <Suspense fallback={<LoadingPlaceholder />}>
              <div className="h-[400px] lg:h-[500px] rounded-xl overflow-hidden border border-border">
                <CombinedListingsMap 
                  resaleListings={resaleListings || []}
                  presaleProjects={presaleProjects || []}
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
              <div className="w-4 h-4 rounded-full" style={{ background: "hsl(222, 47%, 20%)", border: "2px solid hsl(45, 89%, 61%)" }} />
              <span>Presale Projects</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ background: "hsl(45, 89%, 61%)", border: "2px solid white" }} />
              <span>Move-In Ready</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
