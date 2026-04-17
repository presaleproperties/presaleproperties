import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface AssignmentFaqHeroProps {
  eyebrow?: string;
  title: string;
  subhead: string;
  credibility?: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  children?: ReactNode;
}

export function AssignmentFaqHero({
  eyebrow = "Assignments",
  title,
  subhead,
  credibility,
  primaryCta,
  secondaryCta,
  children,
}: AssignmentFaqHeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-foreground via-foreground to-foreground/95 text-background">
      <div className="absolute inset-0 opacity-[0.04] [background-image:radial-gradient(circle_at_1px_1px,_hsl(var(--background))_1px,_transparent_0)] [background-size:24px_24px]" />
      <div className="container relative px-4 py-16 lg:py-24">
        <div className="flex items-center gap-2 text-xs text-background/60 mb-4">
          <Link to="/" className="hover:text-background">Home</Link>
          <span>/</span>
          <Link to="/assignments" className="hover:text-background">Assignments</Link>
          <span>/</span>
          <span className="text-background/80">{eyebrow}</span>
        </div>

        <div className="max-w-3xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary mb-4">
            {eyebrow}
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] mb-5">
            {title}
          </h1>
          <p className="text-lg sm:text-xl text-background/75 leading-relaxed mb-6 max-w-2xl">
            {subhead}
          </p>
          {credibility && (
            <p className="text-sm text-primary font-semibold mb-8 tracking-wide">
              {credibility}
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild size="lg" className="font-semibold">
              <a href={primaryCta.href}>{primaryCta.label}</a>
            </Button>
            {secondaryCta && (
              <Button asChild size="lg" variant="outline" className="bg-transparent border-background/30 text-background hover:bg-background hover:text-foreground font-semibold">
                <a href={secondaryCta.href}>{secondaryCta.label}</a>
              </Button>
            )}
          </div>
          {children}
        </div>
      </div>
    </section>
  );
}
