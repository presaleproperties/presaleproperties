import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Star, ArrowRight } from "lucide-react";

interface TeamMember {
  id: string;
  full_name: string;
  title: string;
  photo_url: string | null;
}

const POINTS = [
  {
    title: "Market Expertise",
    body: "Deep knowledge of the Surrey, Langley, Vancouver, Coquitlam, Burnaby and Abbotsford presale market — we know what's launching, what's worth it, and what to skip.",
  },
  {
    title: "Exclusive Inventory & Incentives",
    body: "VIP access to off-market floor plans, developer credits, and pricing you won't find on public listings — often before launch day.",
  },
  {
    title: "Client-Centric Approach",
    body: "No pressure, no commission games. We give straight answers, full disclosure, and stay with you long after assignment or completion.",
  },
];

const STATS = [
  { value: "$200M+", label: "Sales Volume" },
  { value: "400+", label: "Units Sold" },
  { value: "5 Yrs", label: "In Presale Market" },
];

export function WhyChooseUs() {
  const { data: teamMembers = [], isLoading } = useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_public_team_members");
      if (error) throw error;
      return (data as unknown as TeamMember[]) || [];
    },
  });

  const photos = teamMembers.filter((m) => m.photo_url);

  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-6xl mx-auto">
          {/* Left: Photo collage — 2x2 grid of all team members */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {isLoading || photos.length === 0 ? (
              <>
                <Skeleton className="aspect-square rounded-2xl" />
                <Skeleton className="aspect-square rounded-2xl" />
                <Skeleton className="aspect-square rounded-2xl" />
                <Skeleton className="aspect-square rounded-2xl" />
              </>
            ) : (
              photos.map((m) => (
                <div
                  key={m.id}
                  className="aspect-square rounded-2xl overflow-hidden shadow-lg group relative"
                >
                  <img
                    src={m.photo_url!}
                    alt={`${m.full_name} — ${m.title}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent p-3">
                    <p className="text-on-dark text-xs sm:text-sm font-bold leading-tight">{m.full_name}</p>
                    <p className="text-on-dark/80 text-[10px] sm:text-xs leading-tight">{m.title}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right: Copy */}
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-primary block mb-4">
              Your Presale Team
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground leading-tight mb-5">
              Expert Guidance.{" "}
              <span className="text-primary">No Extra Cost.</span>
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-8">
              Our licensed presale specialists have helped 400+ families secure new homes across
              Surrey, Langley, Vancouver, Coquitlam, Burnaby and Abbotsford. 5 years focused
              exclusively on presales mean you get better pricing, early access, and insider incentives.
            </p>

            <div className="space-y-6 mb-8">
              {POINTS.map((p, i) => (
                <div key={p.title}>
                  <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1.5 flex items-baseline gap-3">
                    <span className="text-primary">{i + 1}.</span>
                    <span>{p.title}</span>
                  </h3>
                  <p className="text-muted-foreground leading-relaxed pl-7 text-sm sm:text-base">
                    {p.body}
                  </p>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 sm:gap-6 py-6 border-t border-b border-border mb-6">
              {STATS.map((s) => (
                <div key={s.label}>
                  <div className="text-2xl sm:text-3xl font-extrabold text-primary leading-none mb-1">
                    {s.value}
                  </div>
                  <div className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Rating + CTA */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <span className="text-sm font-semibold text-foreground">5.0 Google Rating</span>
              </div>
              <Button asChild variant="outline" className="gap-2">
                <Link to="/about">
                  Meet The Team
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
