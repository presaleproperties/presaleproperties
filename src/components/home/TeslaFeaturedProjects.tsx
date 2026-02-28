import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const formatPrice = (price: number | null) => {
  if (!price) return null;
  if (price >= 1_000_000) return `From $${(price / 1_000_000).toFixed(1)}M`;
  if (price >= 1_000) return `From $${Math.round(price / 1_000)}K`;
  return `From $${price.toLocaleString()}`;
};

const statusLabel = (s: string) => {
  if (s === "active") return "Now Selling";
  if (s === "coming_soon") return "Coming Soon";
  return "Register Now";
};

export function TeslaFeaturedProjects() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ["tesla-featured-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("presale_projects")
        .select("id, name, slug, city, neighborhood, status, project_type, completion_year, starting_price, featured_image")
        .eq("is_published", true)
        .not("featured_image", "is", null)
        .order("view_count", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading || !projects || projects.length === 0) return null;

  return (
    <section className="bg-background py-8 sm:py-12">
      {/* Tesla-style: side-by-side panels with padding and rounded corners */}
      <div className="container px-4 sm:px-6 lg:px-8">

        {/* Top row: 2 large side-by-side panels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
          {projects.slice(0, 2).map((project) => (
            <div key={project.id} className="relative overflow-hidden rounded-2xl bg-muted group" style={{ aspectRatio: "16/10" }}>
              <img
                src={project.featured_image!}
                alt={project.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              {/* Top-left label */}
              {project.status && (
                <div className="absolute top-5 left-6">
                  <span className="text-xs font-bold text-white/80">{statusLabel(project.status)}</span>
                </div>
              )}
              {/* Bottom content */}
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight mb-1">
                  {project.name}
                </h3>
                {project.starting_price && (
                  <p className="text-sm text-white/80 underline mb-5">{formatPrice(project.starting_price)}</p>
                )}
                <div className="flex items-center gap-3">
                  <Link
                    to={`/presale/${project.slug}`}
                    className="h-11 px-7 rounded-lg bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center hover:bg-primary/90 transition-colors"
                  >
                    View Project
                  </Link>
                  <Link
                    to="/vip"
                    className="h-11 px-7 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-bold text-white flex items-center justify-center hover:bg-white/20 transition-colors"
                  >
                    Get VIP Access
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom row: up to 4 smaller panels */}
        {projects.length > 2 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {projects.slice(2, 6).map((project) => (
              <Link
                key={project.id}
                to={`/presale/${project.slug}`}
                className="relative overflow-hidden rounded-xl bg-muted group"
                style={{ aspectRatio: "4/3" }}
              >
                <img
                  src={project.featured_image!}
                  alt={project.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-sm sm:text-base font-extrabold text-white leading-tight">{project.name}</h3>
                  <p className="text-[11px] text-white/55 mt-0.5">{project.city}</p>
                  {project.starting_price && (
                    <p className="text-xs font-bold text-primary mt-1">{formatPrice(project.starting_price)}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Mobile CTA */}
        <div className="mt-5 sm:hidden">
          <Link
            to="/presale-projects"
            className="flex items-center justify-center gap-2 w-full h-11 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors"
          >
            View All Projects <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
