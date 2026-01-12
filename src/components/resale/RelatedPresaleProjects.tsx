import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, MapPin, Calendar, Building2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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
}

const STATUS_COLORS: Record<string, string> = {
  selling: "bg-green-500 text-white",
  registering: "bg-blue-500 text-white",
  coming_soon: "bg-amber-500 text-white",
  sold_out: "bg-gray-500 text-white",
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
        .select("id, name, slug, city, neighborhood, featured_image, starting_price, price_range, status, project_type, completion_year, completion_month, developer_name")
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
          .select("id, name, slug, city, neighborhood, featured_image, starting_price, price_range, status, project_type, completion_year, completion_month, developer_name")
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
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:-mx-6 sm:px-6 scroll-snap-x scroll-snap-mandatory">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/presale/${project.slug}`}
              className="flex-shrink-0 w-[calc(100vw-72px)] sm:w-[300px] lg:w-[320px] scroll-snap-start group"
            >
              <div className="bg-card border border-border rounded-xl overflow-hidden transition-all hover:shadow-lg hover:border-primary/30">
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={project.featured_image || "/placeholder.svg"}
                    alt={project.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  {/* Status badge */}
                  <Badge className={`absolute top-3 left-3 ${STATUS_COLORS[project.status] || "bg-primary text-primary-foreground"}`}>
                    {STATUS_LABELS[project.status] || project.status}
                  </Badge>
                  {/* Project type badge */}
                  <Badge variant="secondary" className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm">
                    {project.project_type === "condo" ? "Condo" : project.project_type === "townhouse" ? "Townhouse" : project.project_type}
                  </Badge>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-foreground text-lg mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                    {project.name}
                  </h3>
                  
                  <div className="flex items-center text-sm text-muted-foreground mb-3">
                    <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                    <span className="line-clamp-1">{project.neighborhood}, {project.city}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    {/* Price */}
                    <div>
                      {project.starting_price ? (
                        <p className="font-bold text-foreground">
                          From {formatPrice(project.starting_price)}
                        </p>
                      ) : project.price_range ? (
                        <p className="font-bold text-foreground text-sm">{project.price_range}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Contact for pricing</p>
                      )}
                    </div>

                    {/* Completion */}
                    {project.completion_year && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 mr-1" />
                        {getCompletionText(project.completion_year, project.completion_month)}
                      </div>
                    )}
                  </div>

                  {/* Developer */}
                  {project.developer_name && (
                    <div className="flex items-center text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                      <Building2 className="h-3 w-3 mr-1" />
                      <span className="line-clamp-1">{project.developer_name}</span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
