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
    <section className="py-20 md:py-28 bg-muted/20 relative">
      {/* Top divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      <div className="container px-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              New Developments
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              Featured Presale Projects
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl">
              Explore hand-picked developments across Metro Vancouver
            </p>
          </div>
          <Button variant="outline" size="lg" asChild className="w-fit group">
            <Link to="/presale-projects">
              View All Projects
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl overflow-hidden border">
                <Skeleton className="h-48 w-full" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link
                key={project.id}
                to={`/presale-projects/${project.slug}`}
                className="group bg-card rounded-xl overflow-hidden border hover:shadow-lg transition-all duration-300"
              >
                <div className="relative h-48 overflow-hidden">
                  {project.featured_image ? (
                    <img
                      src={project.featured_image}
                      alt={project.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Building2 className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <Badge
                    variant="outline"
                    className={`absolute top-3 left-3 ${getStatusColor(project.status)}`}
                  >
                    {formatStatus(project.status)}
                  </Badge>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors mb-2">
                    {project.name}
                  </h3>
                  <div className="flex items-center text-sm text-muted-foreground mb-3">
                    <MapPin className="h-4 w-4 mr-1.5 flex-shrink-0" />
                    <span>
                      {project.neighborhood}, {project.city}
                    </span>
                  </div>
                  {(project.completion_year || project.starting_price) && (
                    <div className="flex items-center justify-between text-sm">
                      {project.completion_year && (
                        <div className="flex items-center text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-1.5" />
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
          <div className="text-center py-12 bg-card rounded-xl border">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Featured Projects Coming Soon
            </h3>
            <p className="text-muted-foreground mb-4">
              We're curating the best presale developments for you.
            </p>
            <Button asChild>
              <Link to="/presale-projects">Browse All Projects</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
