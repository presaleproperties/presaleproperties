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
    <section className="relative bg-background overflow-hidden">
      {/* Premium ambient backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 10%, hsl(var(--primary)) 0, transparent 45%), radial-gradient(circle at 90% 80%, hsl(var(--primary)) 0, transparent 50%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.4), transparent)",
        }}
      />

      <div className="relative py-16 md:py-32">
        <div className="container px-4 sm:px-6">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 sm:gap-14 lg:gap-20 items-center">

            {/* Left — Photo collage: premium 2x2 with gold rings + subtle frame */}
            <div className="relative">
              {/* Decorative gold frame offset */}
              <div
                aria-hidden
                className="absolute -inset-3 sm:-inset-4 rounded-3xl border border-primary/20 hidden sm:block"
              />
              <div
                aria-hidden
                className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-primary/10 blur-2xl hidden sm:block"
              />

              <div className="relative grid grid-cols-2 gap-3 sm:gap-4">
                {photosLoading || photos.length === 0
                  ? [0, 1, 2, 3].map((i) => (
                      <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />
                    ))
                  : photos.slice(0, 4).map((m, idx) => (
                      <div
                        key={m.id}
                        className="aspect-[4/5] rounded-2xl overflow-hidden shadow-[0_20px_60px_-20px_rgba(0,0,0,0.4)] ring-1 ring-border/40 hover:ring-primary/50 group relative transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_30px_70px_-20px_hsl(var(--primary)/0.35)]"
                        style={{ transform: idx % 2 === 0 ? "translateY(0)" : "translateY(12px)" }}
                      >
                        <img
                          src={m.photo_url!}
                          alt={`${m.full_name} — ${m.title}`}
                          className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-700 ease-out"
                          loading="lazy"
                        />
                        {/* Premium gradient + gold accent line */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground via-foreground/70 to-transparent pt-10 pb-3 px-3">
                          <div className="h-px w-8 bg-primary mb-2 opacity-90" />
                          <p className="text-background text-xs sm:text-sm font-bold leading-tight tracking-wide">{m.full_name}</p>
                          <p className="text-background/75 text-[10px] sm:text-xs leading-tight mt-0.5">{m.title}</p>
                        </div>
                      </div>
                    ))}
              </div>
            </div>

            {/* Right — Headline + numbered reasons + stats */}
            <div>
              {/* Premium eyebrow with gold rule */}
              <div className="flex items-center gap-3 mb-5">
                <span className="h-px w-10 bg-primary" />
                <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary">
                  Your Presale Team
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-[3.25rem] font-extrabold text-foreground leading-[1.05] mb-6 tracking-tight">
                Why Choose<br />
                <span className="text-primary italic font-serif">Presale Properties?</span>
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-6 max-w-xl">
                With 5+ years focused exclusively on presales and 400+ families served, we help you find new construction homes perfectly aligned with your lifestyle and investment goals.
              </p>

              {/* Languages spoken — refined chips */}
              <div className="mb-10">
                <div className="flex flex-wrap gap-2 mb-2.5">
                  {languages.map((lang) => (
                    <span
                      key={lang}
                      className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border border-border/60 bg-card text-foreground shadow-sm hover:border-primary/40 hover:shadow-md transition-all"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground italic">We serve clients in 5 languages.</p>
              </div>


              <div className="space-y-7 mb-10">
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
                  <div key={p.title} className="group">
                    <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2 flex items-baseline gap-4">
                      <span className="font-serif italic text-primary text-2xl sm:text-3xl leading-none tabular-nums w-7 shrink-0">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span>{p.title}</span>
                    </h3>
                    <p className="text-muted-foreground leading-relaxed pl-11 text-sm sm:text-base">
                      {p.body}
                    </p>
                  </div>
                ))}
              </div>

              {/* Stats strip — premium card with gold gradient values */}
              <div
                className="relative grid grid-cols-3 gap-4 sm:gap-6 px-5 sm:px-6 py-6 mb-7 rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm shadow-[0_10px_40px_-15px_rgba(0,0,0,0.15)]"
              >
                <div
                  aria-hidden
                  className="absolute inset-x-6 top-0 h-px"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.6), transparent)",
                  }}
                />
                {[
                  { value: "$200M+", label: "Sales Volume" },
                  { value: "400+", label: "Units Sold" },
                  { value: "5 Yrs", label: "In Presale Market" },
                ].map((s, idx) => (
                  <div key={s.label} className="relative">
                    {idx > 0 && (
                      <div
                        aria-hidden
                        className="absolute -left-2 sm:-left-3 top-1/2 -translate-y-1/2 h-10 w-px bg-border/60"
                      />
                    )}
                    <div
                      className="text-2xl sm:text-3xl lg:text-[2rem] font-extrabold leading-none mb-1.5 tracking-tight"
                      style={{
                        backgroundImage:
                          "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.7) 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      {s.value}
                    </div>
                    <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Rating + CTA */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-primary/8 border border-primary/20">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-foreground">5.0 Google Rating</span>
                </div>
                <Button
                  asChild
                  variant="outline"
                  className="gap-2 border-foreground/80 text-foreground hover:bg-foreground hover:text-background transition-all group"
                >
                  <Link to="/about">
                    Meet The Team <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
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
