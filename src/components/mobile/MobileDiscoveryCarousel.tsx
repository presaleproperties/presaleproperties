import { useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MobileProjectCard } from "./MobileProjectCard";
import { Skeleton } from "@/components/ui/skeleton";

type CarouselType = 
  | "hot_projects" 
  | "city_vancouver"
  | "city_surrey"
  | "city_burnaby"
  | "city_coquitlam"
  | "city_langley";

interface MobileDiscoveryCarouselProps {
  type: CarouselType;
  title: string;
  city?: string;
  limit?: number;
}

const getCityFromType = (type: CarouselType): string | null => {
  switch (type) {
    case "city_vancouver":
      return "Vancouver";
    case "city_surrey":
      return "Surrey";
    case "city_burnaby":
      return "Burnaby";
    case "city_coquitlam":
      return "Coquitlam";
    case "city_langley":
      return "Langley";
    default:
      return null;
  }
};

export function MobileDiscoveryCarousel({ 
  type, 
  title, 
  city = "all",
  limit = 10 
}: MobileDiscoveryCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: projects, isLoading } = useQuery({
    queryKey: ["mobile-discovery", type, city],
    queryFn: async () => {
      let query = supabase
        .from("presale_projects")
        .select("id, name, slug, city, neighborhood, status, project_type, completion_year, starting_price, deposit_percent, featured_image, last_verified_date")
        .eq("is_published", true);

      // Apply type-specific filters
      if (type === "hot_projects") {
        // Hot projects - featured or recently published active projects
        query = query.eq("status", "active").order("published_at", { ascending: false });
      } else {
        // City-specific carousels
        const cityName = getCityFromType(type);
        if (cityName) {
          query = query.ilike("city", `%${cityName}%`).order("published_at", { ascending: false });
        }
      }

      query = query.limit(limit);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const handleScroll = () => {
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "carousel_scrolled", {
        carousel_type: type,
        carousel_title: title,
      });
    }
  };

  const isHotProjects = type === "hot_projects";
  const cityFromType = getCityFromType(type);
  const seeAllLink = cityFromType 
    ? `/presale-projects?city=${encodeURIComponent(cityFromType)}`
    : "/presale-projects";

  if (isLoading) {
    return (
      <div className="space-y-3 md:hidden">
        <div className="flex items-center justify-between px-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="flex gap-3 overflow-hidden px-4">
          {[1, 2].map((i) => (
            <div key={i} className={isHotProjects ? "shrink-0 w-[260px]" : "shrink-0 w-[220px]"}>
              <Skeleton className="aspect-[16/10] w-full rounded-t-xl" />
              <div className="px-3 py-2 bg-card rounded-b-xl border border-t-0 border-border flex justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-4 w-12" />
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
    <div className="space-y-2.5 md:hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4">
        <h3 className="text-base font-bold text-foreground">{title}</h3>
        <Link 
          to={seeAllLink}
          className="flex items-center gap-1 text-sm font-medium text-primary active:opacity-70"
        >
          See all
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Scrollable Cards - gap ensures peek of next card */}
      {/* Scrollable Cards - gap ensures peek of next card */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-3 overflow-x-auto scrollbar-hide pl-4 pr-10 pb-1"
      >
        {projects.map((project) => (
          <MobileProjectCard
            key={project.id}
            id={project.id}
            slug={project.slug}
            name={project.name}
            city={project.city}
            neighborhood={project.neighborhood}
            projectType={project.project_type}
            status={project.status}
            completionYear={project.completion_year}
            startingPrice={project.starting_price}
            depositPercent={project.deposit_percent}
            featuredImage={project.featured_image}
            lastVerifiedDate={project.last_verified_date}
            size={isHotProjects ? "large" : "default"}
          />
        ))}
      </div>
    </div>
  );
}
