import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin } from "lucide-react";
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

  const [hero, second, ...rest] = projects;

  return (
    <section className="bg-background">
      {/* Section header — Tesla style: label left, link right, full container width */}
      <div className="container px-6 sm:px-8 pt-14 pb-6 flex items-end justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary mb-1.5">Presale Projects</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">Hottest New Developments</h2>
        </div>
        <Link
          to="/presale-projects"
          className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-primary transition-colors"
        >
          View All <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Top row — full-bleed side-by-side, NO gap between edge and cards */}
      {hero && second && (
        <div className="grid grid-cols-2 gap-px bg-border/30">
          {[hero, second].map((project) => (
            <Link
              key={project.id}
              to={`/presale/${project.slug}`}
              className="group relative overflow-hidden bg-muted"
              style={{ aspectRatio: "16/10" }}
            >
              <img
                src={project.featured_image!}
                alt={project.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 md:p-10">
                {project.status && (
                  <span className="inline-block mb-2 text-[10px] font-black uppercase tracking-widest text-primary">
                    {statusLabel(project.status)}
                  </span>
                )}
                <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white leading-tight mb-1">
                  {project.name}
                </h3>
                <p className="text-sm text-white/55 flex items-center gap-1 mb-4">
                  <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                  {project.neighborhood ? `${project.neighborhood}, ` : ""}{project.city}
                </p>
                <div className="flex items-center gap-5">
                  {project.starting_price && (
                    <span className="text-sm font-bold text-primary">{formatPrice(project.starting_price)}</span>
                  )}
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-white/70 group-hover:text-white group-hover:gap-2 transition-all">
                    View Details <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Bottom row — 4 smaller cards, same full-bleed treatment */}
      {rest.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px mt-px bg-border/30">
          {rest.map((project) => (
            <Link
              key={project.id}
              to={`/presale/${project.slug}`}
              className="group relative overflow-hidden bg-muted"
              style={{ aspectRatio: "4/3" }}
            >
              <img
                src={project.featured_image!}
                alt={project.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                <h3 className="text-sm sm:text-base font-extrabold text-white leading-tight mb-0.5">{project.name}</h3>
                <p className="text-[11px] text-white/50 flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-primary shrink-0" />
                  {project.city}
                </p>
                {project.starting_price && (
                  <p className="text-xs font-bold text-primary mt-1">{formatPrice(project.starting_price)}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Mobile CTA */}
      <div className="container px-6 pt-5 pb-2 sm:hidden">
        <Link
          to="/presale-projects"
          className="flex items-center justify-center gap-2 w-full h-11 border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors"
        >
          View All Projects <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
