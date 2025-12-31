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
  subtitle?: string;
  badge?: string;
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
  subtitle,
  badge,
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
        // Hot projects - most viewed projects
        query = query.order("view_count", { ascending: false });
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
      <div className="space-y-3 md:hidden">
        <div className="flex items-center justify-between px-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex gap-3 overflow-hidden" style={{ paddingLeft: '24px', paddingRight: '24px' }}>

          {[1, 2].map((i) => (
            <div key={i} className={isLargeCarousel ? "shrink-0 w-[300px]" : "shrink-0 w-[260px]"}>
              <Skeleton className={isLargeCarousel ? "aspect-[16/10] w-full rounded-t-xl" : "aspect-[3/2] w-full rounded-t-xl"} />
              <div className="px-4 py-3 bg-card rounded-b-xl border border-t-0 border-border space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-20" />
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
    <div className="space-y-4 md:space-y-5 lg:hidden">
      {/* Header - Optimized spacing */}
      <div className="px-6">
        {badge && (
          <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-2 block">
            {badge}
          </span>
        )}
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h3 className={badge ? "text-xl font-bold text-foreground leading-tight" : "text-lg font-bold text-foreground leading-tight"}>{title}</h3>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <Link 
            to={seeAllLink}
            className="flex items-center gap-1.5 text-sm font-semibold text-primary bg-primary/10 active:bg-primary/20 px-3 py-1.5 rounded-full transition-colors shrink-0"
          >
            See all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Scrollable Cards - Large cards with proper edge spacing */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 snap-x snap-mandatory"
        style={{ 
          paddingLeft: '24px', 
          paddingRight: '24px',
          scrollPaddingLeft: '24px',
          scrollPaddingRight: '24px'
        }}
      >
        {projects.map((project) => (
          <div key={project.id} className="snap-start first:ml-0">
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
