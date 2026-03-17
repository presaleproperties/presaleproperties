import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

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
    developerName && { label: "Developer", value: developerName },
    stories && { label: "Stories", value: `${stories}` },
    totalUnits && { label: "Total Units", value: `${totalUnits}` },
    completionYear && { label: "Completion", value: completionYear },
  ].filter(Boolean) as { label: string; value: string }[];

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
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/10" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-16 pt-32 w-full">
        {/* Section watermark */}
        <div className="absolute top-8 left-4 text-[180px] font-black text-white/[0.03] select-none pointer-events-none leading-none">
          01
        </div>

        <div className="max-w-4xl space-y-6">
          {/* Label */}
          <p className="text-primary text-sm font-semibold uppercase tracking-widest">
            01 — Overview
          </p>

          {/* Project name */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight">
            {projectName || "Project Name"}
          </h1>

          {/* Tagline */}
          {tagline && (
            <p className="text-white/70 text-lg sm:text-xl font-light max-w-2xl">
              {tagline}
            </p>
          )}

          {/* Stats row */}
          {stats.length > 0 && (
            <div className="flex flex-wrap gap-3 pt-2">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10"
                >
                  <p className="text-white/50 text-[10px] uppercase tracking-wider">{stat.label}</p>
                  <p className="text-white font-semibold text-sm">{stat.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* CTAs */}
          <div className="flex flex-wrap gap-3 pt-2">
            <Button size="lg" onClick={onFloorPlansClick} className="h-12 px-8">
              View Floor Plans
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={onContactClick}
              className="h-12 px-8 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50 hover:text-white"
            >
              Book a Call
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
        <ChevronDown className="h-6 w-6 text-white/50" />
      </div>
    </section>
  );
}
