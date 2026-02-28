import { useState, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
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
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);

  const { data: projects, isLoading } = useQuery({
    queryKey: ["tesla-featured-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("presale_projects")
        .select("id, name, slug, city, neighborhood, status, project_type, completion_year, starting_price, featured_image")
        .eq("is_published", true)
        .not("featured_image", "is", null)
        .order("view_count", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data ?? [];
    },
  });

  const total = projects?.length ?? 0;

  // Sync dot indicator with scroll position
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.scrollWidth / total;
    const idx = Math.round(el.scrollLeft / cardWidth);
    setCurrent(Math.max(0, Math.min(idx, total - 1)));
  }, [total]);

  // Scroll to card when dot is clicked
  const scrollTo = (i: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.scrollWidth / total;
    el.scrollTo({ left: i * cardWidth, behavior: "smooth" });
  };


  if (isLoading || !projects || projects.length === 0) return null;

  return (
    <section className="bg-background">
      {/* Section title */}
      <div className="container px-4 sm:px-6 lg:px-8 pt-10 pb-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary mb-1.5">Presale Projects</p>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">Hottest New Developments</h2>
      </div>

      {/* Scrollable carousel — snaps per card, peeks next */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-3 sm:gap-4 overflow-x-auto pl-4 sm:pl-6 lg:pl-8 pr-[15vw] sm:pr-[12vw]"
        style={{
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {projects.map((p, i) => (
          <div
            key={p.id}
            className="relative shrink-0 overflow-hidden rounded-2xl bg-muted"
            style={{
              width: "85vw",
              maxWidth: "900px",
              aspectRatio: "16/9",
              scrollSnapAlign: "start",
            }}
          >
            <img
              src={p.featured_image!}
              alt={p.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

            {/* Top-left status */}
            {p.status && (
              <div className="absolute top-5 left-6">
                <span className="text-xs font-bold text-white/70 tracking-wide">{statusLabel(p.status)}</span>
              </div>
            )}

            {/* Bottom content */}
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
              <h3 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight mb-1">
                {p.name}
              </h3>
              {p.starting_price && (
                <p className="text-sm text-white/80 underline mb-5">{formatPrice(p.starting_price)}</p>
              )}
              <div className="flex items-center gap-3">
                <Link
                  to={`/presale/${p.slug}`}
                  className="h-11 px-7 rounded-lg bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center hover:bg-primary/90 transition-colors"
                >
                  View Project
                </Link>
                <Link
                  to="/vip"
                  className="h-11 px-7 rounded-lg bg-white/[0.12] backdrop-blur-sm border border-white/20 text-sm font-bold text-white flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  Get VIP Access
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dot indicator */}
      <div className="flex items-center justify-center gap-2 mt-5 pb-6">
        {projects.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollTo(i)}
            className="transition-all duration-300 rounded-full"
            style={{
              width: i === current ? "28px" : "8px",
              height: "8px",
              background: i === current
                ? "hsl(var(--primary))"
                : "hsl(var(--muted-foreground) / 0.3)",
            }}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
