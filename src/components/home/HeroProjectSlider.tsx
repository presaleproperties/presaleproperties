import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Download, ExternalLink, MapPin, Calendar, Building2, Home, Warehouse } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { FloorPlanModal } from "@/components/projects/FloorPlanModal";

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

export function HeroProjectSlider({ lightOverlay }: { lightOverlay?: boolean } = {}) {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
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

  // Auto-scroll every 9 seconds
  useEffect(() => {
    if (total <= 1 || isPaused) return;
    intervalRef.current = setInterval(next, 9000);
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

      {/* Gradient overlays */}
      <div className={`absolute inset-0 z-[2] pointer-events-none ${lightOverlay ? "bg-gradient-to-t from-black/65 via-black/10 to-black/30" : "bg-gradient-to-t from-black/85 via-black/20 to-black/55"}`} />
      <div className={`absolute inset-0 z-[2] pointer-events-none ${lightOverlay ? "bg-gradient-to-r from-black/25 via-transparent to-transparent" : "bg-gradient-to-r from-black/50 via-transparent to-transparent"}`} />

      {/* Bottom project info — compact, clean */}
      <div className="absolute bottom-0 left-0 right-0 z-[3] px-4 sm:px-8 md:px-14 pb-4 sm:pb-8">
        <div className={`transition-all duration-500 ${isTransitioning ? "opacity-0 translate-y-3" : "opacity-100 translate-y-0"}`}>

          {/* Badges */}
          <div className="flex items-center gap-1 mb-1 sm:mb-2">
            <span className="inline-flex items-center gap-0.5 text-[5px] sm:text-[10px] font-black uppercase tracking-[0.10em] bg-primary text-primary-foreground px-1 py-[1px] sm:px-2.5 sm:py-0.5 rounded">
              {project.status === "active" ? "Now Selling" : project.status === "coming_soon" ? "Coming Soon" : project.status === "registering" ? "Register Now" : "Sold Out"}
            </span>
            <span className="inline-flex items-center gap-0.5 text-[5px] sm:text-[10px] font-semibold text-white/60 bg-white/10 backdrop-blur-sm px-1 py-[1px] sm:px-2 sm:py-0.5 rounded border border-white/15 uppercase tracking-wider">
              {getTypeIcon(project.project_type)}
              {getTypeLabel(project.project_type)}
            </span>
          </div>

          {/* Project name + meta + actions in one row on sm+ */}
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-lg sm:text-2xl md:text-[2rem] font-extrabold text-white leading-tight tracking-tight truncate" style={{ textShadow: "0 2px 16px rgba(0,0,0,0.7)" }}>
                {project.name}
              </h3>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-1">
                <span className="flex items-center gap-1 text-xs text-white/70">
                  <MapPin className="h-3 w-3 text-primary shrink-0" />
                  {project.neighborhood ? `${project.neighborhood}, ` : ""}{project.city}
                </span>
                {project.completion_year && (
                  <span className="flex items-center gap-1 text-[11px] text-white/45">
                    <Calendar className="h-3 w-3 shrink-0" />
                    Est. {project.completion_year}
                  </span>
                )}
                {project.starting_price && (
                  <span className="text-xs font-extrabold text-primary">
                    From {formatPrice(project.starting_price)}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
          {hasAnyDoc ? (
                <>
                  {/* All sizes: open lead form modal to gate document access */}
                  <button
                    onClick={() => setModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 backdrop-blur-md text-white border border-white/25 active:scale-95 transition-all text-xs font-bold whitespace-nowrap"
                  >
                    <Download className="h-3 w-3 text-primary shrink-0" />
                    {hasFloorplan ? "Floor Plans" : hasPricing ? "Pricing" : "Brochure"}
                  </button>
                </>
              ) : (
                /* Mobile: no docs — show Details button */
                <Button asChild size="sm" className="flex sm:hidden rounded-lg font-bold text-xs px-3 h-8 bg-primary hover:bg-primary/90 shadow-lg">
                  <Link to={`/presale/${project.slug}`} className="flex items-center gap-1">
                    Details
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </Button>
              )}
              {/* Details button — tablet+ always */}
              <Button asChild size="sm" className="hidden sm:flex rounded-lg font-bold text-xs px-4 h-8 bg-primary hover:bg-primary/90 shadow-lg">
                <Link to={`/presale/${project.slug}`} className="flex items-center gap-1">
                  Details
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Lead form modal — gated doc access */}
      <FloorPlanModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        projectId={project.id}
        projectName={project.name}
        status={project.status as "coming_soon" | "registering" | "active" | "sold_out"}
        brochureUrl={project.brochure_files?.[0] ?? null}
      />

      {/* Navigation arrows — tablet+ only */}
      {total > 1 && (
        <>
          <button
            onClick={prev}
            className="hidden md:flex absolute left-4 md:left-6 top-1/2 -translate-y-1/2 z-[6] w-9 h-9 md:w-10 md:h-10 rounded-lg bg-black/30 backdrop-blur-md border border-white/15 text-white items-center justify-center hover:bg-black/50 active:scale-95 transition-all"
            aria-label="Previous project"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={next}
            className="hidden md:flex absolute right-4 md:right-6 top-1/2 -translate-y-1/2 z-[6] w-9 h-9 md:w-10 md:h-10 rounded-lg bg-black/30 backdrop-blur-md border border-white/15 text-white items-center justify-center hover:bg-black/50 active:scale-95 transition-all"
            aria-label="Next project"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

        </>
      )}
    </div>
  );
}
