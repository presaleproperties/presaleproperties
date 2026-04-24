import { Link } from "react-router-dom";
import { useState } from "react";
import { ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface TeamMember {
  id: string;
  full_name: string;
  title: string;
  photo_url: string | null;
}

function useTeamPhotos() {
  return useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_public_team_members");
      if (error) throw error;
      return ((data as unknown as TeamMember[]) || []).filter((m) => m.photo_url);
    },
  });
}


const languages = ["English", "Hindi", "Punjabi", "Urdu", "Arabic"];

function VIPInlineForm() {
  const [form, setForm] = useState({ firstName: "", email: "" });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const { error: dbError } = await supabase.from("vip_registrations").insert({
        first_name: form.firstName,
        email: form.email,
        source: "presale_experts_section",
        landing_page: window.location.pathname,
      });
      if (dbError) throw dbError;
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-3 space-y-1">
        <div className="text-2xl">🎉</div>
        <p className="text-sm font-bold text-background">You're on the VIP list!</p>
        <p className="text-xs text-background/50">We'll send you early access details.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          required
          placeholder="First name"
          value={form.firstName}
          onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
          className="flex-1 h-11 px-3 rounded-lg border border-background/20 bg-background/10 text-sm text-background placeholder:text-background/40 focus:outline-none focus:ring-2 focus:ring-primary/60"
        />
        <input
          type="email"
          required
          placeholder="Email address"
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          className="flex-1 h-11 px-3 rounded-lg border border-background/20 bg-background/10 text-sm text-background placeholder:text-background/40 focus:outline-none focus:ring-2 focus:ring-primary/60"
        />
      </div>
      <Button type="submit" disabled={isSubmitting} size="lg" className="w-full shadow-lg shadow-primary/30 font-semibold text-base">
        {isSubmitting ? "Joining..." : "Join VIP — It's Free"}
      </Button>
      {error && <p className="text-center text-xs text-danger">{error}</p>}
      <p className="text-center text-xs text-background/40">No obligation. Unsubscribe anytime.</p>
    </form>
  );
}

export function PresaleExpertsSection() {
  const { data: photos = [], isLoading: photosLoading } = useTeamPhotos();
  return (
    <section className="bg-background">
      {/* Middle: Why Choose Us — photo collage + numbered reasons (Springfield-style) */}
      <div className="py-12 md:py-28 bg-background">
        <div className="container px-4 sm:px-6">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-16 items-center">

            {/* Left — Photo collage: 2x2 equal-size cards (all team members) */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {photosLoading || photos.length === 0
                ? [0, 1, 2, 3].map((i) => (
                    <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />
                  ))
                : photos.slice(0, 4).map((m) => (
                    <div
                      key={m.id}
                      className="aspect-[4/5] rounded-2xl overflow-hidden shadow-lg ring-1 ring-border/50 group relative"
                    >
                      <img
                        src={m.photo_url!}
                        alt={`${m.full_name} — ${m.title}`}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/90 via-foreground/30 to-transparent p-2.5">
                        <p className="text-background text-xs sm:text-sm font-bold leading-tight">{m.full_name}</p>
                        <p className="text-background/80 text-[10px] sm:text-xs leading-tight">{m.title}</p>
                      </div>
                    </div>
                  ))}
            </div>

            {/* Right — Headline + numbered reasons + stats */}
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-primary block mb-3">
                Your Presale Team
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground leading-tight mb-5">
                Why Choose<br />
                <span className="text-primary">Presale Properties?</span>
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-5">
                With 5+ years focused exclusively on presales and 400+ families served, we help you find new construction homes perfectly aligned with your lifestyle and investment goals.
              </p>

              {/* Languages spoken */}
              <div className="mb-8">
                <div className="flex flex-wrap gap-2 mb-2">
                  {languages.map((lang) => (
                    <span
                      key={lang}
                      className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border border-border bg-muted/50 text-foreground"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">We serve clients in 5 languages.</p>
              </div>


              <div className="space-y-6 mb-8">
                {[
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
                    body: "No pressure, no commission games. Straight answers, full disclosure, and ongoing support long after assignment or completion.",
                  },
                ].map((p, i) => (
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

              {/* Stats strip */}
              <div className="grid grid-cols-3 gap-4 sm:gap-6 py-5 border-t border-b border-border/30 mb-6">
                {[
                  { value: "$200M+", label: "Sales Volume" },
                  { value: "400+", label: "Units Sold" },
                  { value: "5 Yrs", label: "In Presale Market" },
                ].map((s) => (
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
                    Meet The Team <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}
