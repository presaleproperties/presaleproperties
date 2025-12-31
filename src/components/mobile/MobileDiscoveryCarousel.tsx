import { useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MobileProjectCard } from "./MobileProjectCard";
import { Skeleton } from "@/components/ui/skeleton";

type CarouselType = 
  | "hot_projects"
  | "condos"
  | "townhomes"
  | "single_family"
  | "city_vancouver"
  | "city_surrey"
  | "city_burnaby"
  | "city_coquitlam"
  | "city_langley"
  | "city_richmond"
  | "city_delta"
  | "city_abbotsford";

interface MobileDiscoveryCarouselProps {
  type: CarouselType;
  title: string;
  city?: string;
  limit?: number;
  size?: "default" | "large";
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
    case "city_richmond":
      return "Richmond";
    case "city_delta":
      return "Delta";
    case "city_abbotsford":
      return "Abbotsford";
    default:
      return null;
  }
};

export function MobileDiscoveryCarousel({ 
  type, 
  title, 
  city = "all",
  limit = 10,
  size
}: MobileDiscoveryCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: projects, isLoading } = useQuery({
    queryKey: ["mobile-discovery", type, city],
    queryFn: async () => {
      let query = supabase
        .from("presale_projects")
        .select("id, name, slug, city, neighborhood, status, project_type, completion_year, starting_price, deposit_percent, featured_image, gallery_images, last_verified_date")
        .eq("is_published", true);

      // Apply type-specific filters
      if (type === "hot_projects") {
        // Hot projects - featured or recently published active projects
        query = query.eq("status", "active").order("published_at", { ascending: false });
      } else if (type === "condos") {
        // Condos only
        query = query.eq("project_type", "condo").order("published_at", { ascending: false });
      } else if (type === "townhomes") {
        // Townhomes only
        query = query.eq("project_type", "townhome").order("published_at", { ascending: false });
      } else if (type === "single_family") {
        // Single-family/detached homes
        query = query.eq("project_type", "single_family").order("published_at", { ascending: false });
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

  // Determine if this is a large carousel
  const isLargeCarousel = size === "large" || type === "hot_projects" || type === "condos" || type === "townhomes" || type === "single_family";
  
  const cityFromType = getCityFromType(type);
  const getSeeAllLink = () => {
    if (type === "condos") return "/presale-projects?type=condo";
    if (type === "townhomes") return "/presale-projects?type=townhome";
    if (type === "single_family") return "/presale-projects?type=single_family";
    if (cityFromType) return `/presale-projects?city=${encodeURIComponent(cityFromType)}`;
    return "/presale-projects";
  };
  const seeAllLink = getSeeAllLink();

  if (isLoading) {
    return (
      <div className="space-y-2 md:hidden">
        <div className="flex items-center justify-between px-4">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-14" />
        </div>
        <div className="flex gap-2.5 overflow-hidden px-4">
          {[1, 2].map((i) => (
            <div key={i} className={isLargeCarousel ? "shrink-0 w-[280px]" : "shrink-0 w-[240px]"}>
              <Skeleton className={isLargeCarousel ? "aspect-[4/3] w-full rounded-t-lg" : "aspect-[3/2] w-full rounded-t-lg"} />
              <div className="px-2.5 py-2 bg-card rounded-b-lg border border-t-0 border-border/50 flex justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-2.5 w-14" />
                </div>
                <Skeleton className="h-3.5 w-16" />
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
    <div className="space-y-2 md:hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4">
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <Link 
          to={seeAllLink}
          className="flex items-center gap-0.5 text-xs font-medium text-primary active:opacity-70"
        >
          See all
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Scrollable Cards */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-2.5 overflow-x-auto scrollbar-hide pl-4 pr-8 pb-0.5 snap-x snap-mandatory"
      >
        {projects.map((project) => (
          <div key={project.id} className="snap-start">
            <MobileProjectCard
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
              galleryImages={project.gallery_images}
              lastVerifiedDate={project.last_verified_date}
              size={isLargeCarousel ? "large" : "default"}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
