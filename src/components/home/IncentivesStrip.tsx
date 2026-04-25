import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { generateProjectUrl } from "@/lib/seoUrls";

interface IncentiveProject {
  id: string;
  name: string;
  slug: string;
  city: string;
  neighborhood: string | null;
  project_type: "condo" | "townhome" | "mixed" | "duplex" | "single_family";
  starting_price: number | null;
  featured_image: string | null;
  incentives: string | null;
}

const formatPrice = (price: number | null) => {
  if (!price) return null;
  if (price >= 1000000) {
    const m = price / 1000000;
    return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(2)}M`;
  }
  return `$${Math.round(price / 1000)}K`;
};

export function IncentivesStrip() {
  const { data, isLoading } = useQuery({
    queryKey: ["homepage-incentives-strip"],
    queryFn: async (): Promise<IncentiveProject[]> => {
      const { data, error } = await supabase
        .from("presale_projects")
        .select(
          "id,name,slug,city,neighborhood,project_type,starting_price,featured_image,incentives,incentives_available"
        )
        .eq("is_published", true)
        .or("incentives_available.eq.true,incentives.not.is.null")
        .limit(10);
      if (error) throw error;
      return ((data ?? []) as any[]).filter(
        (p) =>
          p.incentives_available === true ||
          (p.incentives && p.incentives.trim().length > 0)
      );
    },
  });

  if (!isLoading && (!data || data.length === 0)) return null;

  const count = data?.length ?? 0;

  return (
    <section className="py-10 sm:py-14 bg-gradient-to-br from-success/5 via-background to-background border-y border-success/15">
      <div className="container px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-6 mb-5 sm:mb-7">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-success-soft text-success-strong border border-success/30 rounded-full px-3 py-1 mb-2">
              <Sparkles className="h-3 w-3" />
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Active Incentives
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-[2rem] font-extrabold text-foreground tracking-tight leading-tight">
              {count > 0 ? (
                <>
                  <span className="text-success-strong">{count}+ projects</span> with active discounts right now
                </>
              ) : (
                "Projects with Active Discounts"
              )}
            </h2>
            <p className="text-muted-foreground text-sm mt-1.5 max-w-md">
              Cash credits, GST coverage, low-deposit programs and more — updated regularly.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="hidden sm:flex w-fit group rounded-full border-success/40 hover:border-success hover:bg-success-soft hover:text-success-strong"
          >
            <Link to="/presale-incentives">
              View All Deals
              <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        {/* Horizontal scroll cards */}
        {isLoading ? (
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-44 w-[280px] shrink-0 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 snap-x snap-mandatory">
            {data!.map((p) => {
              const url = generateProjectUrl({
                slug: p.slug,
                neighborhood: p.neighborhood || p.city,
                projectType: p.project_type,
              });
              return (
                <Link
                  key={p.id}
                  to={url}
                  className="group shrink-0 w-[280px] sm:w-[320px] snap-start"
                >
                  <div className="relative rounded-xl overflow-hidden bg-card border border-border/60 hover:border-success/50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 h-full">
                    <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                      {p.featured_image ? (
                        <img
                          src={p.featured_image}
                          alt={`${p.name} incentive offer`}
                          loading="lazy"
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-muted to-muted/50" />
                      )}
                      <div className="absolute top-3 left-3">
                        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-success text-success-foreground text-[10px] font-bold uppercase tracking-wide shadow-sm">
                          <Sparkles className="h-2.5 w-2.5" />
                          Incentive
                        </div>
                      </div>
                      {p.starting_price && (
                        <div className="absolute bottom-2 right-2 bg-background/95 backdrop-blur px-2 py-0.5 rounded-md text-xs font-bold shadow">
                          From {formatPrice(p.starting_price)}
                        </div>
                      )}
                    </div>
                    <div className="p-3.5">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-success-strong uppercase tracking-wide mb-1">
                        <MapPin className="h-2.5 w-2.5" />
                        {p.neighborhood || p.city}
                      </div>
                      <h3 className="font-bold text-sm text-foreground leading-tight line-clamp-1 group-hover:text-success-strong transition-colors">
                        {p.name}
                      </h3>
                      {p.incentives && (
                        <p className="mt-1.5 text-[12px] text-muted-foreground leading-snug line-clamp-2">
                          {p.incentives}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Mobile CTA */}
        <div className="mt-5 sm:hidden">
          <Button asChild variant="outline" className="w-full rounded-full border-success/40 hover:bg-success-soft hover:text-success-strong">
            <Link to="/presale-incentives">
              View All Active Deals
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
