import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PresaleProjectCard } from "@/components/listings/PresaleProjectCard";
import { supabase } from "@/integrations/supabase/client";
import { useRef, useState, useEffect } from "react";

interface CityProjectsCarouselProps {
  city: string;
  title: string;
  subtitle?: string;
  excludeSlug?: string;
}

export function CityProjectsCarousel({ city, title, subtitle, excludeSlug }: CityProjectsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const { data: projects, isLoading } = useQuery({
    queryKey: ["city-projects", city, excludeSlug],
    queryFn: async () => {
      let query = supabase
        .from("presale_projects")
        .select("id, name, slug, city, neighborhood, status, project_type, completion_year, starting_price, featured_image, gallery_images")
        .eq("is_published", true)
        .ilike("city", `%${city}%`)
        .order("is_featured", { ascending: false })
        .order("published_at", { ascending: false })
        .limit(excludeSlug ? 11 : 10);

      if (excludeSlug) {
        query = query.neq("slug", excludeSlug);
      }

      const { data, error } = await query;

      if (error) throw error;
      // If we excluded a slug and got 11, trim to 10
      return excludeSlug && data && data.length > 10 ? data.slice(0, 10) : data;
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
    checkScroll();
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener("scroll", checkScroll);
      return () => ref.removeEventListener("scroll", checkScroll);
    }
  }, [projects]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="shrink-0 w-[280px] sm:w-[320px]">
              <Skeleton className="h-48 w-full rounded-xl" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 md:space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-foreground">{title}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Desktop scroll buttons */}
          <div className="hidden md:flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Link to={`/presale-projects?city=${encodeURIComponent(city)}`}>
            <Button variant="ghost" size="sm" className="text-primary">
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Scrollable cards */}
      <div
        ref={scrollRef}
        className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 md:mx-0 md:px-0"
      >
        {projects.map((project) => (
          <div key={project.id} className="shrink-0 w-[280px] sm:w-[320px] md:w-[360px]">
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
              size="large"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
