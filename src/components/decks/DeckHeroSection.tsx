import { Button } from "@/components/ui/button";
import { ChevronDown, Building2, Layers, Calendar, Users } from "lucide-react";

interface DeckHeroSectionProps {
  projectName: string;
  tagline?: string;
  heroImageUrl?: string;
  developerName?: string;
  stories?: number;
  totalUnits?: number;
  completionYear?: string;
  onFloorPlansClick: () => void;
  onContactClick: () => void;
}

export function DeckHeroSection({
  projectName,
  tagline,
  heroImageUrl,
  developerName,
  stories,
  totalUnits,
  completionYear,
  onFloorPlansClick,
  onContactClick,
}: DeckHeroSectionProps) {
  const stats = [
    developerName && { icon: Building2, label: "Developer", value: developerName },
    stories && { icon: Layers, label: "Stories", value: `${stories} Floors` },
    totalUnits && { icon: Users, label: "Total Units", value: `${totalUnits}` },
    completionYear && { icon: Calendar, label: "Completion", value: completionYear },
  ].filter(Boolean) as { icon: any; label: string; value: string }[];

  return (
    <section
      id="overview"
      className="relative min-h-screen flex flex-col justify-end overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 z-0">
        {heroImageUrl ? (
          <img
            src={heroImageUrl}
            alt={projectName}
            className="w-full h-full object-cover object-center"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-muted/80" />
        )}
        {/* Multi-stop dark overlay for better text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/98 via-black/60 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
      </div>

      {/* Top badge */}
      <div className="absolute top-8 left-4 sm:left-8 z-10">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/30">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-primary text-[11px] font-semibold uppercase tracking-widest">
            Exclusive Presale Opportunity
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pb-20 pt-32 w-full">
        {/* Section watermark */}
        <div className="absolute top-8 right-4 text-[160px] font-black text-white/[0.03] select-none pointer-events-none leading-none">
          01
        </div>

        <div className="max-w-4xl space-y-5">
          {/* Label */}
          <p className="text-primary text-xs font-semibold uppercase tracking-[0.2em]">
            01 — Overview
          </p>

          {/* Project name */}
          <h1 className="text-5xl sm:text-6xl lg:text-[4.5rem] font-bold text-white leading-[1.05] tracking-tight">
            {projectName || "Project Name"}
          </h1>

          {/* Tagline */}
          {tagline && (
            <p className="text-white/65 text-lg sm:text-xl font-light max-w-2xl leading-relaxed">
              {tagline}
            </p>
          )}

          {/* Stats row */}
          {stats.length > 0 && (
            <div className="flex flex-wrap gap-2.5 pt-1">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/8 backdrop-blur-md border border-white/12 hover:bg-white/12 transition-colors"
                >
                  <stat.icon className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <p className="text-white/45 text-[9px] uppercase tracking-wider leading-none mb-0.5">{stat.label}</p>
                    <p className="text-white font-semibold text-xs leading-none">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Divider */}
          <div className="w-16 h-px bg-primary/60 mt-2" />

          {/* CTAs */}
          <div className="flex flex-wrap gap-3 pt-1">
            <Button
              size="lg"
              onClick={onFloorPlansClick}
              className="h-12 px-8 text-sm font-semibold shadow-lg shadow-primary/30"
            >
              View Floor Plans & Pricing
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={onContactClick}
              className="h-12 px-8 bg-white/8 border-white/25 text-white hover:bg-white/15 hover:border-white/40 hover:text-white text-sm font-semibold backdrop-blur-sm"
            >
              Book a Private Call
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 animate-bounce">
        <span className="text-white/30 text-[10px] uppercase tracking-widest">Scroll</span>
        <ChevronDown className="h-5 w-5 text-white/40" />
      </div>
    </section>
  );
}
