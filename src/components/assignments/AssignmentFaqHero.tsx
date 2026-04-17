import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export interface HeroStat {
  value: string;
  label: string;
}

interface AssignmentFaqHeroProps {
  eyebrow?: string;
  title: string;
  subhead: string;
  credibility?: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  stats?: HeroStat[];
  children?: ReactNode;
}

export function AssignmentFaqHero({
  eyebrow = "Assignments",
  title,
  subhead,
  credibility,
  primaryCta,
  secondaryCta,
  stats,
  children,
}: AssignmentFaqHeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-foreground via-foreground to-foreground/95 text-background">
      {/* Subtle dot grid */}
      <div className="absolute inset-0 opacity-[0.04] [background-image:radial-gradient(circle_at_1px_1px,_hsl(var(--background))_1px,_transparent_0)] [background-size:24px_24px]" />
      {/* Soft primary glow */}
      <div className="pointer-events-none absolute -top-32 -right-24 h-[420px] w-[420px] rounded-full bg-primary/20 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -left-24 h-[360px] w-[360px] rounded-full bg-primary/10 blur-[120px]" />

      <div className="container relative px-4 py-14 sm:py-20 lg:py-28">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-background/60 mb-6">
          <Link to="/" className="hover:text-background transition-colors">Home</Link>
          <span aria-hidden>/</span>
          <Link to="/assignments" className="hover:text-background transition-colors">Assignments</Link>
          <span aria-hidden>/</span>
          <span className="text-background/85">{eyebrow}</span>
        </nav>

        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-background/15 bg-background/[0.04] px-3 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.22em] text-primary mb-5 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            {eyebrow}
          </span>
          <h1 className="text-[2.25rem] sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] mb-5 text-balance">
            {title}
          </h1>
          <p className="text-base sm:text-xl text-background/75 leading-relaxed mb-6 max-w-2xl text-pretty">
            {subhead}
          </p>
          {credibility && (
            <p className="text-xs sm:text-sm text-primary font-semibold mb-8 tracking-wide max-w-2xl">
              {credibility}
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild size="lg" className="font-semibold gap-2 w-full sm:w-auto shadow-lg shadow-primary/20">
              <a href={primaryCta.href}>
                {primaryCta.label}
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            {secondaryCta && (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="bg-transparent border-background/30 text-background hover:bg-background hover:text-foreground font-semibold w-full sm:w-auto"
              >
                <a href={secondaryCta.href}>{secondaryCta.label}</a>
              </Button>
            )}
          </div>
          {children}

          {stats && stats.length > 0 && (
            <dl className="mt-10 sm:mt-12 grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl border-t border-background/10 pt-6 sm:pt-8">
              {stats.map((s) => (
                <div key={s.label} className="min-w-0">
                  <dt className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-background/55 mb-1.5 leading-tight">{s.label}</dt>
                  <dd className="text-2xl sm:text-3xl lg:text-4xl font-bold text-background tracking-tight tabular-nums">{s.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>

      {/* Soft bottom fade into next section */}
      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-b from-transparent to-background/[0.02] pointer-events-none" />
    </section>
  );
}
