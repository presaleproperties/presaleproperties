import { Link } from "react-router-dom";
import { useState } from "react";
import { TrendingUp, Clock, Shield, Palette, Home, Building2, ArrowRight, Star, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const benefits = [
  {
    icon: TrendingUp,
    title: "Lock In Today's Price",
    description: "Secure a home before it's built and benefit from appreciation before you move in."
  },
  {
    icon: Clock,
    title: "Flexible Deposits",
    description: "Only 5–20% upfront, staggered over time. More runway to prepare your mortgage."
  },
  {
    icon: Palette,
    title: "Customize Your Home",
    description: "Choose finishes, colours & upgrades. Your new home, exactly the way you want it."
  },
  {
    icon: Shield,
    title: "New Home Warranty",
    description: "Full BC warranty coverage — 2-5-10 years on materials, envelope & structure."
  },
  {
    icon: Home,
    title: "Modern Design",
    description: "Energy-efficient, built to latest codes with smart home technology included."
  },
  {
    icon: Building2,
    title: "Prime Locations",
    description: "New developments near SkyTrain, schools & amenities in Metro Vancouver's fastest-growing neighbourhoods."
  }
];

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
      {error && <p className="text-center text-xs text-red-400">{error}</p>}
      <p className="text-center text-xs text-background/40">No obligation. Unsubscribe anytime.</p>
    </form>
  );
}

export function PresaleExpertsSection() {
  return (
    <section className="bg-background">
      {/* Top: Why Buy Presale — benefits grid */}
      <div className="py-10 md:py-24 border-b border-border/40">
        <div className="container px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8 lg:gap-16 items-center">

              {/* Left — editorial text block */}
              <div className="space-y-5">
                <span className="text-xs font-semibold uppercase tracking-widest text-primary block">
                  Why Buy Presale
                </span>
                <h2 className="text-3xl sm:text-4xl md:text-[42px] font-extrabold text-foreground leading-tight tracking-tight">
                  New Construction in Metro Vancouver,{" "}
                  <span className="text-primary">Done Right</span>
                </h2>
                <p className="text-muted-foreground leading-relaxed max-w-md">
                  Presale homes let you enter the market at today's price, customise your space, and build equity before you move in — with less upfront capital than resale.
                </p>
                <p className="text-muted-foreground leading-relaxed max-w-md">
                  Our team guides you through every step, from understanding disclosure statements to negotiating incentives and securing VIP pricing before public launch.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {languages.map((lang) => (
                    <span
                      key={lang}
                      className="text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary bg-primary/5 font-medium"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">We serve clients in 5 languages.</p>
                <div className="flex gap-3 pt-2">
                  <Button asChild size="sm">
                    <Link to="/contact">Get VIP Access</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/presale-projects" className="flex items-center gap-1.5">
                      Browse Projects <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Right — 2x3 benefit cards */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {benefits.map((b, i) => (
                  <div
                    key={i}
                    className={cn(
                      "rounded-xl border border-border bg-card p-4 sm:p-5 hover:border-primary/30 hover:shadow-sm transition-all duration-300 space-y-2"
                    )}
                  >
                    <div className="p-2 bg-primary/10 rounded-lg w-fit">
                      <b.icon className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground leading-snug">{b.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{b.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Expert Trust + VIP CTA — two-column dark/gold split */}
      <div className="bg-foreground text-background py-10 md:py-20">
        <div className="container px-4 sm:px-6">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 md:gap-16 items-center">

            {/* Left — Expert credibility */}
            <div className="space-y-5">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary block">
                Your Presale Team
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-background leading-tight">
                Expert Guidance.{" "}
                <span className="text-primary">No Extra Cost.</span>
              </h2>
              <p className="text-background/65 leading-relaxed">
                Our licensed presale specialists have helped 400+ families secure new homes across Surrey, Langley, Vancouver, Coquitlam, Burnaby and Abbotsford. 5 years focused exclusively on presales mean you get better pricing, early access, and insider incentives.
              </p>

              {/* Proof row */}
              <div className="grid grid-cols-3 gap-4 pt-2">
                {[
                  { value: "$200M+", label: "Sales Volume" },
                  { value: "400+", label: "Units Sold" },
                  { value: "5 Yrs", label: "In Presale Market" },
                ].map((s) => (
                  <div key={s.label} className="space-y-0.5">
                    <div className="text-xl sm:text-2xl font-extrabold text-primary">{s.value}</div>
                    <div className="text-xs text-background/50 uppercase tracking-wider">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Stars */}
              <div className="flex items-center gap-2 pt-1">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <span className="text-sm text-background/60 font-medium">5.0 Google Rating</span>
              </div>

              <Button asChild variant="outline" className="border-background/30 text-background hover:bg-background/10 hover:text-background mt-1">
                <Link to="/about" className="flex items-center gap-2">
                  Meet The Team <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Right — VIP Membership card */}
            <div className="relative rounded-2xl border-2 border-primary/60 bg-primary/5 p-5 sm:p-9 space-y-4 sm:space-y-5 shadow-[0_0_60px_hsl(40_65%_55%/0.15)]">
              {/* Gold badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary rounded-full shadow-lg">
                <Award className="h-3.5 w-3.5 text-primary-foreground" />
                <span className="text-xs font-bold uppercase tracking-wider text-primary-foreground">VIP Access</span>
              </div>

              <div className="space-y-2 pt-3">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-background leading-tight">
                  Get Early Access to<br />
                  <span className="text-primary">Presale Projects</span>
                </h3>
                <p className="text-background/60 text-sm leading-relaxed">
                  Join our VIP list and be the first to receive floor plans, pricing sheets, and exclusive developer incentives before public launch — at zero cost.
                </p>
              </div>

              <ul className="space-y-2.5 text-sm text-background/70">
                {[
                  "Priority access before public release",
                  "Exclusive developer incentives & bonuses",
                  "Floor plans & pricing direct to your inbox",
                  "Expert advice with no obligation",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-0.5 h-4 w-4 rounded-full bg-primary/20 border border-primary/50 text-primary flex items-center justify-center flex-shrink-0 text-[10px] font-bold">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <VIPInlineForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
