import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, MapPin, Calendar, Building2, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { generateProjectUrl } from "@/lib/seoUrls";

interface RelatedPresaleProjectsProps {
  city: string;
  neighborhood?: string;
  limit?: number;
  title?: string;
  subtitle?: string;
}

interface PresaleProject {
  id: string;
  name: string;
  slug: string;
  city: string;
  neighborhood: string;
  featured_image: string | null;
  starting_price: number | null;
  price_range: string | null;
  status: string;
  project_type: string;
  completion_year: number | null;
  completion_month: number | null;
  developer_name: string | null;
  developer_id: string | null;
  developers?: {
    website_url: string | null;
  } | null;
}

const STATUS_COLORS: Record<string, string> = {
  selling: "bg-success text-on-dark",
  registering: "bg-info text-on-dark",
  coming_soon: "bg-warning text-on-dark",
  sold_out: "bg-neutral-500 text-on-dark",
};

const STATUS_LABELS: Record<string, string> = {
  selling: "Selling Now",
  registering: "Registering",
  coming_soon: "Coming Soon",
  sold_out: "Sold Out",
};

export const RelatedPresaleProjects = ({
  city,
  neighborhood,
  limit = 6,
  title,
  subtitle,
}: RelatedPresaleProjectsProps) => {
  const { data: projects, isLoading } = useQuery({
    queryKey: ["related-presale-projects", city, neighborhood, limit],
    queryFn: async () => {
      let query = supabase
        .from("presale_projects")
        .select("id, name, slug, city, neighborhood, featured_image, starting_price, price_range, status, project_type, completion_year, completion_month, developer_name, developer_id, developers(website_url)")
        .eq("is_published", true)
        .ilike("city", city)
        .neq("status", "sold_out")
        .order("is_featured", { ascending: false })
        .order("starting_price", { ascending: true })
        .limit(limit);

      // If neighborhood is provided, prioritize it
      if (neighborhood) {
        query = query.ilike("neighborhood", `%${neighborhood}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // If we didn't get enough from the neighborhood, get more from the city
      if (neighborhood && data && data.length < limit) {
        const { data: cityData } = await supabase
          .from("presale_projects")
          .select("id, name, slug, city, neighborhood, featured_image, starting_price, price_range, status, project_type, completion_year, completion_month, developer_name, developer_id, developers(website_url)")
          .eq("is_published", true)
          .ilike("city", city)
          .neq("status", "sold_out")
          .not("id", "in", `(${data.map(p => `"${p.id}"`).join(",")})`)
          .order("is_featured", { ascending: false })
          .order("starting_price", { ascending: true })
          .limit(limit - data.length);

        return [...data, ...(cityData || [])] as PresaleProject[];
      }

      return data as PresaleProject[];
    },
    enabled: !!city,
    staleTime: 5 * 60 * 1000,
  });

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(1)}M`;
    }
    return `$${Math.round(price / 1000)}K`;
  };

  const getCompletionText = (year: number | null, month: number | null) => {
    if (!year) return null;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    if (month && month >= 1 && month <= 12) {
      return `${months[month - 1]} ${year}`;
    }
    return `${year}`;
  };

  if (isLoading) {
    return (
      <section className="py-8 sm:py-12">
        <div className="container px-4 sm:px-6">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:-mx-6 sm:px-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[280px] sm:w-[300px]">
                <Skeleton className="aspect-[4/3] rounded-xl mb-3" />
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!projects || projects.length === 0) {
    return null;
  }

  const displayTitle = title || `Presale Projects in ${city}`;
  const displaySubtitle = subtitle || "New developments coming soon — get in before completion";

  return (
    <section className="py-8 sm:py-12 bg-muted/30">
      <div className="container px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1">
              {displayTitle}
            </h2>
            <p className="text-sm text-muted-foreground">{displaySubtitle}</p>
          </div>
          <Link to={`/presale-projects?city=${encodeURIComponent(city)}`}>
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
              See all <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Carousel */}
        <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:-mx-6 sm:px-6 scroll-snap-x scroll-snap-mandatory">
          {projects.map((project) => {
            const projectUrl = generateProjectUrl({
              slug: project.slug,
              neighborhood: project.neighborhood,
              projectType: project.project_type as "condo" | "townhome" | "mixed" | "duplex" | "single_family",
            });
            return (
            <Link
              key={project.id}
              to={projectUrl}
              className="flex-shrink-0 w-[calc(100vw-72px)] sm:w-[280px] lg:w-[300px] scroll-snap-start group"
            >
              <div className="bg-card border border-border rounded-xl overflow-hidden transition-all hover:shadow-lg hover:border-primary/30 h-full">
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={project.featured_image || "/placeholder.svg"}
                    alt={project.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  {/* Status badge */}
                  <Badge className={`absolute top-2 left-2 sm:top-3 sm:left-3 text-[10px] sm:text-xs ${STATUS_COLORS[project.status] || "bg-primary text-primary-foreground"}`}>
                    {STATUS_LABELS[project.status] || project.status}
                  </Badge>
                  {/* Project type badge */}
                  <Badge variant="secondary" className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-background/80 backdrop-blur-sm text-[10px] sm:text-xs">
                    {project.project_type === "condo" ? "Condo" : project.project_type === "townhouse" ? "Townhouse" : project.project_type}
                  </Badge>
                </div>

                {/* Content */}
                <div className="p-3 sm:p-4">
                  <h3 className="font-semibold text-foreground text-sm sm:text-base mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                    {project.name}
                  </h3>
                  
                  <div className="flex items-center text-[11px] sm:text-sm text-muted-foreground mb-2 sm:mb-3">
                    <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 flex-shrink-0" />
                    <span className="line-clamp-1 truncate">{project.neighborhood}, {project.city}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    {/* Price */}
                    <div className="min-w-0">
                      {project.starting_price ? (
                        <p className="font-bold text-foreground text-sm sm:text-base whitespace-nowrap">
                          From {formatPrice(project.starting_price)}
                        </p>
                      ) : project.price_range ? (
                        <p className="font-bold text-foreground text-xs sm:text-sm truncate">{project.price_range}</p>
                      ) : (
                        <p className="text-[11px] sm:text-sm text-muted-foreground">Contact for pricing</p>
                      )}
                    </div>

                    {/* Completion */}
                    {project.completion_year && (
                      <div className="flex items-center text-[11px] sm:text-sm text-muted-foreground shrink-0">
                        <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                        {getCompletionText(project.completion_year, project.completion_month)}
                      </div>
                    )}
                  </div>

                  {/* Developer with backlink */}
                  {project.developer_name && (
                    <div className="flex items-center text-[10px] sm:text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                      <Building2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1 shrink-0" />
                      {project.developers?.website_url ? (
                        <a
                          href={project.developers.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="line-clamp-1 truncate hover:text-primary hover:underline transition-colors flex items-center gap-0.5"
                        >
                          {project.developer_name}
                          <ExternalLink className="h-2 w-2 sm:h-2.5 sm:w-2.5 shrink-0 opacity-60" />
                        </a>
                      ) : (
                        <span className="line-clamp-1 truncate">{project.developer_name}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};
