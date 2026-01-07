import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight, Building2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PresaleProjectCard } from "@/components/listings/PresaleProjectCard";
import { supabase } from "@/integrations/supabase/client";
import { useRef, useState, useEffect } from "react";

export function FeaturedProjects() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const { data: projects, isLoading } = useQuery({
    queryKey: ["most-viewed-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("presale_projects")
        .select("id, name, slug, city, neighborhood, status, project_type, completion_year, starting_price, featured_image, gallery_images, view_count")
        .eq("is_published", true)
        .order("view_count", { ascending: false })
        .limit(6);

      if (error) throw error;
      return data;
    },
  });

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll);
      checkScroll();
      return () => el.removeEventListener("scroll", checkScroll);
    }
  }, [projects]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const cardWidth = 480; // Approximate width of large card + gap
      scrollRef.current.scrollBy({
        left: direction === "left" ? -cardWidth : cardWidth,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-28 bg-muted/20 relative">
      {/* Top divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      <div className="container px-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 sm:gap-6 mb-8 sm:mb-10 md:mb-12">
          <div className="space-y-2 sm:space-y-3">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-primary">
              Don't Miss Out
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              Hottest Presale Projects
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-xl">
              The most in-demand new developments across Metro Vancouver
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            {/* Desktop scroll buttons */}
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" asChild className="ml-2 group">
              <Link to="/presale-projects">
                View All Projects
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex gap-4 overflow-hidden">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[calc(100vw-48px)] sm:w-[420px] lg:w-[460px] bg-card rounded-xl overflow-hidden border">
                <Skeleton className="h-56 sm:h-64 lg:h-72 w-full" />
                <div className="p-5 sm:p-6 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-5 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : projects && projects.length > 0 ? (
          <div
            ref={scrollRef}
            className="flex gap-4 lg:gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide pb-4"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {projects.map((project) => (
              <div 
                key={project.id} 
                className="flex-shrink-0 w-[calc(100vw-48px)] sm:w-[420px] lg:w-[460px] snap-start"
              >
                <PresaleProjectCard
                  id={project.id}
                  slug={project.slug}
                  name={project.name}
                  city={project.city}
                  neighborhood={project.neighborhood}
                  projectType={project.project_type}
                  status={project.status}
                  completionYear={project.completion_year}
                  startingPrice={project.starting_price}
                  featuredImage={project.featured_image}
                  galleryImages={project.gallery_images}
                  size="featured"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 sm:py-12 bg-card rounded-xl border">
            <Building2 className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">
              Featured Projects Coming Soon
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4">
              We're curating the best presale developments for you.
            </p>
            <Button asChild>
              <Link to="/presale-projects">Browse All Projects</Link>
            </Button>
          </div>
        )}

        {/* Mobile CTA */}
        <div className="mt-6 sm:hidden">
          <Link to="/presale-projects">
            <Button variant="outline" className="w-full">
              View All Projects
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
