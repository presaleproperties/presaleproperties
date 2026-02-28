import { useState, useEffect, useCallback, useRef } from "react";
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
  const trackRef = useRef<HTMLDivElement>(null);

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
  const next = useCallback(() => setCurrent((c) => Math.min(c + 1, total - 1)), [total]);
  const prev = useCallback(() => setCurrent((c) => Math.max(c - 1, 0)), []);

  // Auto-advance every 5s
  useEffect(() => {
    if (total < 2) return;
    const t = setInterval(() => setCurrent((c) => (c + 1) % total), 5000);
    return () => clearInterval(t);
  }, [total]);

  // Touch / swipe
  const touchStartX = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    if (dx > 50) next();
    else if (dx < -50) prev();
  };

  if (isLoading || !projects || projects.length === 0) return null;

  return (
    <section className="bg-background">
      {/* Section title */}
      <div className="container px-4 sm:px-6 lg:px-8 pt-10 pb-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary mb-1.5">Presale Projects</p>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">Hottest New Developments</h2>
      </div>

      {/* Carousel — peek next card on the right */}
      <div
        className="overflow-hidden pl-4 sm:pl-6 lg:pl-8"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          ref={trackRef}
          className="flex gap-3 sm:gap-4 transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(calc(-${current} * (85vw + 12px)))` }}
        >
          {projects.map((p, i) => (
            <div
              key={p.id}
              className="relative shrink-0 overflow-hidden rounded-2xl bg-muted cursor-pointer"
              style={{ width: "85vw", maxWidth: "900px", aspectRatio: "16/9" }}
              onClick={() => i !== current && setCurrent(i)}
            >
              <img
                src={p.featured_image!}
                alt={p.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700"
                style={{ transform: i === current ? "scale(1)" : "scale(1.03)" }}
              />
              {/* Dim non-active cards */}
              {i !== current && (
                <div className="absolute inset-0 bg-black/30 z-10" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

              {/* Top-left status */}
              {p.status && (
                <div className="absolute top-5 left-6 z-20">
                  <span className="text-xs font-bold text-white/70 tracking-wide">{statusLabel(p.status)}</span>
                </div>
              )}

              {/* Bottom content — only fully visible on active */}
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 z-20">
                <h3 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight mb-1">
                  {p.name}
                </h3>
                {p.starting_price && (
                  <p className="text-sm text-white/80 underline mb-5">{formatPrice(p.starting_price)}</p>
                )}
                {i === current && (
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
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dot indicator bar */}
      <div className="flex items-center justify-center gap-2 mt-5 pb-6">
        {projects.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
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
