import { lazy, Suspense, useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { MapPin, ChevronRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Lazy load the map
const HomeMapView = lazy(() => import("./HomeMapView").then(m => ({ default: m.HomeMapView })));

export function HomeMapSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Intersection observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Fetch projects with coordinates
  const { data: projects, isLoading } = useQuery({
    queryKey: ["home-map-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("presale_projects")
        .select("id, name, slug, city, neighborhood, status, project_type, starting_price, featured_image, map_lat, map_lng")
        .eq("is_published", true)
        .not("status", "eq", "sold_out")
        .order("is_featured", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isVisible,
  });

  // Only show projects with valid coordinates
  const projectsWithCoords = projects?.filter(p => p.map_lat && p.map_lng) || [];

  return (
    <section ref={sectionRef} className="py-12 md:py-16 bg-muted/30">
      <div className="container px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 text-primary mb-2">
            <MapPin className="h-5 w-5" />
            <span className="text-sm font-medium uppercase tracking-wide">Explore by Location</span>
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3">
            Find Projects on the Map
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm md:text-base">
            See presale condos and townhomes by location across Metro Vancouver
          </p>
        </div>

        {/* Map Container */}
        <div className="relative rounded-xl overflow-hidden border bg-card shadow-lg">
          {!isVisible ? (
            <div className="h-[400px] md:h-[500px] flex items-center justify-center bg-muted">
              <div className="text-center text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-2 animate-pulse" />
                <p>Loading map...</p>
              </div>
            </div>
          ) : (
            <Suspense fallback={
              <div className="h-[400px] md:h-[500px] flex items-center justify-center bg-muted">
                <div className="text-center text-muted-foreground">
                  <Loader2 className="h-10 w-10 mx-auto mb-2 animate-spin" />
                  <p>Loading map...</p>
                </div>
              </div>
            }>
              <div className="h-[400px] md:h-[500px]">
                <HomeMapView projects={projectsWithCoords} isLoading={isLoading} />
              </div>
            </Suspense>
          )}
        </div>

        {/* CTA */}
        <div className="text-center mt-6">
          <Link to="/map-search">
            <Button size="lg" className="gap-2">
              Open Full Map Search
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground mt-2">
            {projectsWithCoords.length} projects with map locations
          </p>
        </div>
      </div>
    </section>
  );
}
