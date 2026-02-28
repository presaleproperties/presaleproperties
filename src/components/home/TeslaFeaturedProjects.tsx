import { useState, useEffect, useCallback } from "react";
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

  const next = useCallback(() => setCurrent((c) => (c + 1) % total), [total]);

  // Auto-advance every 5s
  useEffect(() => {
    if (total < 2) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [next, total]);

  if (isLoading || !projects || projects.length === 0) return null;

  const project = projects[current];

  return (
    <section className="bg-background">
      {/* Section title */}
      <div className="container px-4 sm:px-6 lg:px-8 pt-10 pb-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary mb-1.5">Presale Projects</p>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">Hottest New Developments</h2>
      </div>

      {/* Full-width carousel card */}
      <div className="container px-4 sm:px-6 lg:px-8 pb-6">
        <div className="relative overflow-hidden rounded-2xl bg-muted" style={{ aspectRatio: "16/7" }}>
          {/* Slides — crossfade */}
          {projects.map((p, i) => (
            <div
              key={p.id}
              className="absolute inset-0 transition-opacity duration-700"
              style={{ opacity: i === current ? 1 : 0, pointerEvents: i === current ? "auto" : "none" }}
            >
              <img
                src={p.featured_image!}
                alt={p.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

              {/* Top-left status */}
              {p.status && (
                <div className="absolute top-6 left-8">
                  <span className="text-xs font-bold text-white/70 tracking-wide">{statusLabel(p.status)}</span>
                </div>
              )}

              {/* Bottom content */}
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
                <h3 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight mb-1">
                  {p.name}
                </h3>
                {p.starting_price && (
                  <p className="text-sm sm:text-base text-white/80 underline mb-6">{formatPrice(p.starting_price)}</p>
                )}
                <div className="flex items-center gap-3">
                  <Link
                    to={`/presale/${p.slug}`}
                    className="h-12 px-8 rounded-lg bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center hover:bg-primary/90 transition-colors"
                  >
                    View Project
                  </Link>
                  <Link
                    to="/vip"
                    className="h-12 px-8 rounded-lg bg-white/[0.12] backdrop-blur-sm border border-white/20 text-sm font-bold text-white flex items-center justify-center hover:bg-white/20 transition-colors"
                  >
                    Get VIP Access
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Dot indicator bar */}
        <div className="flex items-center justify-center gap-2 mt-5">
          {projects.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="transition-all duration-300 rounded-full"
              style={{
                width: i === current ? "28px" : "8px",
                height: "8px",
                background: i === current ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.3)",
              }}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
