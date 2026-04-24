import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface TeamMember {
  id: string;
  full_name: string;
  title: string;
  photo_url: string | null;
}

const POINTS = [
  {
    title: "Market Expertise",
    body: "Deep knowledge of Vancouver, Burnaby, Surrey & the Fraser Valley presale market — we know what's launching, what's worth it, and what to skip.",
  },
  {
    title: "Exclusive Inventory",
    body: "VIP access to off-market floor plans, developer credits, and pricing you won't find on public listings — often before launch day.",
  },
  {
    title: "Client-Centric Approach",
    body: "No pressure, no commission games. We give straight answers, full disclosure, and stay with you long after assignment or completion.",
  },
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

  // Show all team members with photos in the collage
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
                    <p className="text-white text-xs sm:text-sm font-bold leading-tight">{m.full_name}</p>
                    <p className="text-white/80 text-[10px] sm:text-xs leading-tight">{m.title}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right: Copy */}
          <div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground leading-tight mb-5">
              Why Choose <span className="text-primary">Presale Properties?</span>
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-8">
              With years of experience and deep market insight, our team helps you find presale and
              off-market homes perfectly aligned with your lifestyle and investment goals.
            </p>

            <div className="space-y-7">
              {POINTS.map((p, i) => (
                <div key={p.title}>
                  <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2 flex items-baseline gap-3">
                    <span className="text-primary">{i + 1}.</span>
                    <span>{p.title}</span>
                  </h3>
                  <p className="text-muted-foreground leading-relaxed pl-7">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
