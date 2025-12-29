import { useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MobileProjectCard } from "./MobileProjectCard";
import { Skeleton } from "@/components/ui/skeleton";

type CarouselType = 
  | "selling_now" 
  | "newly_launched" 
  | "best_entry_price" 
  | "completing_soon" 
  | "investor_picks" 
  | "near_skytrain";

interface MobileDiscoveryCarouselProps {
  type: CarouselType;
  title: string;
  city?: string;
  limit?: number;
}

const getQueryConfig = (type: CarouselType, city: string) => {
  const baseQuery = {
    select: "id, name, slug, city, neighborhood, status, project_type, completion_year, starting_price, deposit_percent, featured_image, last_verified_date",
    isPublished: true,
    city: city !== "all" ? city : null,
  };

  switch (type) {
    case "selling_now":
      return { ...baseQuery, status: "active", orderBy: "published_at" };
    case "newly_launched":
      return { ...baseQuery, orderBy: "created_at" };
    case "best_entry_price":
      return { ...baseQuery, orderBy: "starting_price", ascending: true };
    case "completing_soon":
      return { ...baseQuery, orderBy: "completion_year", ascending: true };
    case "investor_picks":
      return { ...baseQuery, nearSkytrain: true, orderBy: "starting_price", ascending: true };
    case "near_skytrain":
      return { ...baseQuery, nearSkytrain: true, orderBy: "published_at" };
    default:
      return baseQuery;
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

      // Apply city filter
      if (city && city !== "all") {
        query = query.ilike("city", `%${city}%`);
      }

      // Apply type-specific filters
      switch (type) {
        case "selling_now":
          query = query.eq("status", "active").order("published_at", { ascending: false });
          break;
        case "newly_launched":
          query = query.order("created_at", { ascending: false });
          break;
        case "best_entry_price":
          query = query.not("starting_price", "is", null).order("starting_price", { ascending: true });
          break;
        case "completing_soon":
          query = query
            .not("completion_year", "is", null)
            .gte("completion_year", new Date().getFullYear())
            .order("completion_year", { ascending: true });
          break;
        case "investor_picks":
        case "near_skytrain":
          query = query.eq("near_skytrain", true).order("starting_price", { ascending: true });
          break;
      }

      query = query.limit(limit);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const handleScroll = () => {
    // Track carousel scroll
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "carousel_scrolled", {
        carousel_type: type,
        carousel_title: title,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3 md:hidden">
        <div className="flex items-center justify-between px-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="flex gap-3 overflow-hidden px-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="shrink-0 w-[165px]">
              <Skeleton className="aspect-[4/3] w-full rounded-t-xl" />
              <div className="p-2.5 space-y-2 bg-card rounded-b-xl border border-t-0 border-border">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
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
    <div className="space-y-3 md:hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4">
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
        <Link 
          to={`/presale-projects?filter=${type}${city !== "all" ? `&city=${city}` : ""}`}
          className="flex items-center gap-1 text-sm font-medium text-primary active:opacity-70"
        >
          See all
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Scrollable Cards */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-1"
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
          />
        ))}
      </div>
    </div>
  );
}
