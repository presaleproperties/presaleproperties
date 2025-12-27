import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Calendar, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

export function FeaturedProjects() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ["featured-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("presale_projects")
        .select("*")
        .eq("is_published", true)
        .eq("is_featured", true)
        .order("published_at", { ascending: false })
        .limit(6);

      if (error) throw error;
      return data;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-success/10 text-success border-success/20";
      case "coming_soon":
        return "bg-warning/10 text-warning border-warning/20";
      case "sold_out":
        return "bg-muted text-muted-foreground border-muted";
      default:
        return "bg-muted text-muted-foreground border-muted";
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-28 bg-muted/20 relative">
      {/* Top divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      <div className="container px-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 sm:gap-6 mb-8 sm:mb-10 md:mb-12">
          <div className="space-y-2 sm:space-y-3">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-primary">
              New Developments
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              Featured Presale Projects
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-xl">
              Explore hand-picked developments across Metro Vancouver
            </p>
          </div>
          <Button variant="outline" size="lg" asChild className="hidden sm:flex w-fit group">
            <Link to="/presale-projects">
              View All Projects
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl overflow-hidden border">
                <Skeleton className="h-40 sm:h-48 w-full" />
                <div className="p-4 sm:p-5 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {projects.map((project) => (
              <Link
                key={project.id}
                to={`/presale-projects/${project.slug}`}
                className="group bg-card rounded-xl overflow-hidden border border-border hover:border-primary/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08),0_0_0_1px_hsl(var(--primary)/0.1)] hover:-translate-y-1 transition-all duration-300 ease-out"
              >
                <div className="relative h-40 sm:h-48 overflow-hidden">
                  {project.featured_image ? (
                    <img
                      src={project.featured_image}
                      alt={project.name}
                      className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Building2 className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Badge
                    variant="outline"
                    className={`absolute top-3 left-3 ${getStatusColor(project.status)} backdrop-blur-sm`}
                  >
                    {formatStatus(project.status)}
                  </Badge>
                </div>
                <div className="p-4 sm:p-5">
                  <h3 className="font-semibold text-base sm:text-lg text-foreground group-hover:text-primary transition-colors mb-1.5 sm:mb-2 line-clamp-1">
                    {project.name}
                  </h3>
                  <div className="flex items-center text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
                    <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5 flex-shrink-0" />
                    <span className="truncate">
                      {project.neighborhood}, {project.city}
                    </span>
                  </div>
                  {(project.completion_year || project.starting_price) && (
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      {project.completion_year && (
                        <div className="flex items-center text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                          <span>
                            {project.completion_month
                              ? `${project.completion_month}/${project.completion_year}`
                              : project.completion_year}
                          </span>
                        </div>
                      )}
                      {project.starting_price && (
                        <span className="font-medium text-foreground">
                          From ${project.starting_price.toLocaleString()}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
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
