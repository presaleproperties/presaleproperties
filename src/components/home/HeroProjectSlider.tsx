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

      {/* Gradient overlays — deep cinematic feel */}
      <div className="absolute inset-0 z-[2] bg-gradient-to-t from-black/85 via-black/20 to-black/55 pointer-events-none" />
      <div className="absolute inset-0 z-[2] bg-gradient-to-r from-black/50 via-transparent to-transparent pointer-events-none" />

      {/* Bottom project info card */}
      <div className="absolute bottom-0 left-0 right-0 z-[3] px-5 sm:px-8 md:px-14 pb-7 sm:pb-10">
        <div
          className={`transition-all duration-500 ${isTransitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"}`}
        >
          {/* Badges row */}
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.15em] bg-primary text-primary-foreground px-3 py-1 rounded-md shadow-lg">
              {project.status === "active" ? "Now Selling" : project.status === "coming_soon" ? "Coming Soon" : project.status === "registering" ? "Register Now" : "Sold Out"}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-white/65 bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-md border border-white/15 uppercase tracking-wider">
              {getTypeIcon(project.project_type)}
              {getTypeLabel(project.project_type)}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            {/* Left: project info */}
            <div className="max-w-xl">
              <h3 className="text-[1.65rem] sm:text-3xl md:text-[2.5rem] font-extrabold text-white leading-tight tracking-tight" style={{ textShadow: "0 2px 20px rgba(0,0,0,0.6)" }}>
                {project.name}
              </h3>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5">
                <span className="flex items-center gap-1.5 text-sm text-white/75 font-medium">
                  <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                  {project.neighborhood ? `${project.neighborhood}, ` : ""}{project.city}
                </span>
                {project.completion_year && (
                  <span className="flex items-center gap-1 text-[13px] text-white/50">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    Est. {project.completion_year}
                  </span>
                )}
                {project.starting_price && (
                  <span className="text-sm font-extrabold text-primary" style={{ textShadow: "0 0 20px hsl(40 65% 55% / 0.4)" }}>
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
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 backdrop-blur-md text-white border border-white/20 hover:bg-white/25 active:scale-95 transition-all text-xs font-bold whitespace-nowrap shadow-lg"
                >
                  <Download className="h-3.5 w-3.5 text-primary" />
                  {hasFloorplan ? "Floor Plans" : hasPricing ? "Pricing" : "Brochure"}
                </a>
              )}
              <Button asChild size="sm" className="rounded-xl font-bold text-xs px-4 shadow-xl h-9 bg-primary hover:bg-primary/90">
                <Link to={`/presale/${project.slug}`} className="flex items-center gap-1.5">
                  View Details
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation arrows — premium glass */}
      {total > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-[4] w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-black/30 backdrop-blur-md border border-white/15 text-white flex items-center justify-center hover:bg-black/50 hover:border-white/30 active:scale-95 transition-all shadow-xl"
            aria-label="Previous project"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-[4] w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-black/30 backdrop-blur-md border border-white/15 text-white flex items-center justify-center hover:bg-black/50 hover:border-white/30 active:scale-95 transition-all shadow-xl"
            aria-label="Next project"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Gold pill indicators */}
          <div className="absolute bottom-[130px] sm:bottom-[150px] right-5 sm:right-8 z-[4] flex items-center gap-1.5">
            {projects.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`transition-all duration-400 rounded-full ${
                  i === current
                    ? "w-6 h-1.5 bg-primary shadow-[0_0_8px_hsl(40_65%_55%/0.6)]"
                    : "w-1.5 h-1.5 bg-white/30 hover:bg-white/55"
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
