import { useState, useEffect, lazy, Suspense, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Map, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { SafeMapWrapper } from "@/components/map/SafeMapWrapper";

// Lazy load the map component
const ProjectsMap = lazy(() => 
  import("@/components/projects/ProjectsMap").then(m => ({ default: m.ProjectsMap }))
);

export function HomeMapSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            // Add a small delay before loading map to ensure smooth scroll
            setTimeout(() => setShouldLoad(true), 100);
            observer.disconnect();
          }
        });
      },
      { 
        rootMargin: "200px", // Start loading 200px before visible
        threshold: 0.1 
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Fetch projects with coordinates
  const { data: projects, isLoading } = useQuery({
    queryKey: ["homepage-map-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("presale_projects")
        .select("id, name, slug, city, neighborhood, status, project_type, starting_price, featured_image, map_lat, map_lng")
        .eq("is_published", true)
        .not("status", "eq", "sold_out")
        .order("is_featured", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    enabled: shouldLoad, // Only fetch when section is about to be visible
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Count projects with valid coordinates
  const projectsWithCoords = projects?.filter(p => p.map_lat && p.map_lng) || [];
  const hasValidProjects = projectsWithCoords.length > 0;

  // Loading placeholder
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
              Explore Projects on the Map
            </h2>
            <p className="text-muted-foreground mt-2 text-sm md:text-base max-w-xl">
              Find presale condos and townhomes near you. Click on any pin to see project details.
            </p>
          </div>
          <Link to="/presale-projects?view=map">
            <Button variant="outline" className="gap-2">
              Open Full Map
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Map Container */}
        {!isVisible ? (
          <LoadingPlaceholder />
        ) : !shouldLoad || isLoading ? (
          <LoadingPlaceholder />
        ) : !hasValidProjects ? (
          <div className="h-[400px] lg:h-[500px] rounded-xl bg-muted flex items-center justify-center border border-border">
            <div className="text-center text-muted-foreground p-6">
              <Map className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <h3 className="font-semibold text-foreground mb-2">Projects Loading</h3>
              <p className="text-sm mb-4">
                Map data is being prepared. Use our search to browse projects.
              </p>
              <Link to="/presale-projects">
                <Button variant="default" size="sm">
                  Browse All Projects
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <SafeMapWrapper height="h-[400px] lg:h-[500px]">
            <Suspense fallback={<LoadingPlaceholder />}>
              <div className="h-[400px] lg:h-[500px] rounded-xl overflow-hidden border border-border">
                <ProjectsMap 
                  projects={projectsWithCoords as any} 
                  isLoading={false}
                />
              </div>
            </Suspense>
          </SafeMapWrapper>
        )}

        {/* Stats Bar */}
        {hasValidProjects && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 md:gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500" />
              <span>Selling Now</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-500" />
              <span>Registering</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <span>Coming Soon</span>
            </div>
            <span className="text-foreground font-medium">
              {projectsWithCoords.length} projects shown
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
