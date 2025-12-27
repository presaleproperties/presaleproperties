import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

interface NearbyProjectsProps {
  currentProjectId: string;
  city: string;
  neighborhood?: string;
}

export function NearbyProjects({ currentProjectId, city, neighborhood }: NearbyProjectsProps) {
  const { data: projects, isLoading } = useQuery({
    queryKey: ["nearby-projects", city, currentProjectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("presale_projects")
        .select("id, name, slug, city, neighborhood, project_type, status, featured_image")
        .eq("is_published", true)
        .neq("id", currentProjectId)
        .eq("city", city)
        .limit(3);

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="bg-muted/30 rounded-xl p-4">
        <h3 className="font-semibold mb-4">Other Nearby Projects</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-20 h-14 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!projects || projects.length === 0) return null;

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "coming_soon":
        return { label: "Coming Soon", className: "bg-blue-500 text-white" };
      case "active":
        return { label: "Now Selling", className: "bg-green-500 text-white" };
      case "sold_out":
        return { label: "Sold Out", className: "bg-muted text-muted-foreground" };
      default:
        return null;
    }
  };

  return (
    <div className="bg-muted/30 rounded-xl p-4">
      <h3 className="font-semibold text-foreground mb-4">Other Nearby Projects</h3>
      <div className="space-y-3">
        {projects.map((project) => {
          const statusBadge = getStatusLabel(project.status);
          return (
            <Link
              key={project.id}
              to={`/presale-projects/${project.slug}`}
              className="flex gap-3 group hover:bg-muted/50 -mx-2 px-2 py-2 rounded-lg transition-colors"
            >
              <div className="relative w-20 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                {project.featured_image ? (
                  <img
                    src={project.featured_image}
                    alt={project.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                    No Image
                  </div>
                )}
                {statusBadge && (
                  <Badge 
                    className={`absolute top-1 left-1 text-[10px] px-1.5 py-0 ${statusBadge.className}`}
                  >
                    {statusBadge.label}
                  </Badge>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors truncate">
                  {project.name}
                </h4>
                <p className="text-xs text-muted-foreground capitalize">
                  {project.project_type}
                </p>
                <p className="text-xs text-muted-foreground">
                  {project.neighborhood || project.city}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
