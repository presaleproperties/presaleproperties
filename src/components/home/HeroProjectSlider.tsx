import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Download, ExternalLink, MapPin, Calendar, Building2, Home, Warehouse } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const formatPrice = (price: number | null) => {
  if (!price) return null;
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(1)}M`;
  if (price >= 1_000) return `$${Math.round(price / 1_000)}K`;
  return `$${price.toLocaleString()}`;
};

const getTypeIcon = (type: string | null) => {
  if (type === "townhome") return <Warehouse className="h-3 w-3" />;
  if (type === "single_family") return <Home className="h-3 w-3" />;
  return <Building2 className="h-3 w-3" />;
};

const getTypeLabel = (type: string | null) => {
  if (type === "townhome") return "Townhome";
  if (type === "single_family") return "Single Family";
  return "Condo";
};

export function HeroProjectSlider() {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: projects } = useQuery({
    queryKey: ["hero-slider-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("presale_projects")
        .select("id, name, slug, city, neighborhood, status, project_type, completion_year, starting_price, featured_image, gallery_images, brochure_files, floorplan_files, pricing_sheets")
        .eq("is_published", true)
        .not("featured_image", "is", null)
        .order("view_count", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data?.filter(p => p.featured_image) ?? [];
    },
  });

  const total = projects?.length ?? 0;

  const goTo = useCallback((index: number) => {
    if (isTransitioning || total === 0) return;
    setIsTransitioning(true);
    setCurrent(((index % total) + total) % total);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning, total]);

  const next = useCallback(() => goTo(current + 1), [goTo, current]);
  const prev = useCallback(() => goTo(current - 1), [goTo, current]);

  // Auto-scroll every 5 seconds
  useEffect(() => {
    if (total <= 1 || isPaused) return;
    intervalRef.current = setInterval(next, 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [next, total, isPaused]);

  if (!projects || total === 0) return null;

  const project = projects[current];
  const hasFloorplan = project.floorplan_files && project.floorplan_files.length > 0;
  const hasPricing = project.pricing_sheets && project.pricing_sheets.length > 0;
  const hasBrochure = project.brochure_files && project.brochure_files.length > 0;
  const hasAnyDoc = hasFloorplan || hasPricing || hasBrochure;

  return (
    <div
      className="absolute inset-0"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides */}
      {projects.map((p, i) => (
        <div
          key={p.id}
          className={`absolute inset-0 transition-opacity duration-700 ${i === current ? "opacity-100 z-[1]" : "opacity-0 z-0"}`}
        >
          <img
            src={p.featured_image!}
            alt={p.name}
            className="absolute inset-0 w-full h-full object-cover"
            loading={i === 0 ? "eager" : "lazy"}
          />
        </div>
      ))}

      {/* Gradient overlays - ensure text visibility */}
      <div className="absolute inset-0 z-[2] bg-gradient-to-t from-black/80 via-black/30 to-black/50 pointer-events-none" />
      <div className="absolute inset-0 z-[2] bg-gradient-to-r from-black/40 via-transparent to-transparent pointer-events-none" />

      {/* Bottom project info card */}
      <div className="absolute bottom-0 left-0 right-0 z-[3] px-5 sm:px-8 md:px-12 pb-6 sm:pb-8">
        <div
          className={`transition-all duration-500 ${isTransitioning ? "opacity-0 translate-y-3" : "opacity-100 translate-y-0"}`}
        >
          {/* Status badge */}
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest bg-primary/90 text-primary-foreground px-2.5 py-1 rounded-full">
              {project.status === "active" ? "Now Selling" : project.status === "coming_soon" ? "Coming Soon" : project.status === "registering" ? "Register Now" : "Sold Out"}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-white/70 uppercase tracking-wider">
              {getTypeIcon(project.project_type)}
              {getTypeLabel(project.project_type)}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            {/* Left: project info */}
            <div className="max-w-lg">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight tracking-tight drop-shadow-lg">
                {project.name}
              </h3>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                <span className="flex items-center gap-1 text-sm text-white/80 font-medium">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  {project.neighborhood ? `${project.neighborhood}, ` : ""}{project.city}
                </span>
                {project.completion_year && (
                  <span className="flex items-center gap-1 text-sm text-white/60">
                    <Calendar className="h-3.5 w-3.5" />
                    Est. {project.completion_year}
                  </span>
                )}
                {project.starting_price && (
                  <span className="text-sm font-bold text-primary drop-shadow">
                    From {formatPrice(project.starting_price)}
                  </span>
                )}
              </div>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-2 shrink-0">
              {hasAnyDoc && (
                <a
                  href={hasFloorplan ? project.floorplan_files![0] : hasPricing ? project.pricing_sheets![0] : project.brochure_files![0]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/15 backdrop-blur-sm text-white border border-white/25 hover:bg-white/25 transition-all text-xs font-semibold whitespace-nowrap"
                >
                  <Download className="h-3.5 w-3.5" />
                  {hasFloorplan ? "Floor Plans" : hasPricing ? "Pricing" : "Brochure"}
                </a>
              )}
              <Button asChild size="sm" className="rounded-full font-bold text-xs px-4 shadow-lg">
                <Link to={`/presale/${project.slug}`} className="flex items-center gap-1.5">
                  View Details
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation arrows */}
      {total > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-[4] w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center hover:bg-black/60 transition-all"
            aria-label="Previous project"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-[4] w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center hover:bg-black/60 transition-all"
            aria-label="Next project"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-[110px] sm:bottom-[120px] left-1/2 -translate-x-1/2 z-[4] flex items-center gap-1.5">
            {projects.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`transition-all duration-300 rounded-full ${
                  i === current
                    ? "w-5 h-1.5 bg-primary"
                    : "w-1.5 h-1.5 bg-white/40 hover:bg-white/60"
                }`}
                aria-label={`Go to project ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
