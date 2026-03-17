import { Button } from "@/components/ui/button";
import { ChevronDown, Building2, Layers, Calendar, Users, MessageCircle } from "lucide-react";

interface DeckHeroSectionProps {
  projectName: string;
  tagline?: string;
  heroImageUrl?: string;
  developerName?: string;
  stories?: number;
  totalUnits?: number;
  completionYear?: string;
  whatsappNumber?: string;
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
  whatsappNumber,
  onFloorPlansClick,
  onContactClick,
}: DeckHeroSectionProps) {
  const stats = [
    developerName && { icon: Building2, label: "Developer", value: developerName },
    stories && { icon: Layers, label: "Stories", value: `${stories} Floors` },
    totalUnits && { icon: Users, label: "Units", value: `${totalUnits}` },
    completionYear && { icon: Calendar, label: "Completion", value: completionYear },
  ].filter(Boolean) as { icon: any; label: string; value: string }[];

  const waNumber = (whatsappNumber || "17782313592").replace(/\D/g, "");
  const waMessage = encodeURIComponent(`Hi! I'm interested in ${projectName} — can you share more details?`);

  return (
    <section
      id="overview"
      className="relative flex flex-col justify-end overflow-hidden"
      style={{ height: "100dvh" }}
    >
      {/* Background image — fixed position avoids iOS scroll flicker */}
      <div className="absolute inset-0 z-0">
        {heroImageUrl ? (
          <img
            src={heroImageUrl}
            alt={projectName}
            className="w-full h-full object-cover object-center"
            loading="eager"
            fetchPriority="high"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-muted/80" />
        )}
        {/* Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
      </div>

      {/* Top badge */}
      <div className="absolute top-5 left-4 sm:top-8 sm:left-8 z-10">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/20">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-primary text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest">
            Exclusive Presale Opportunity
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pb-24 sm:pb-20 pt-28 w-full">
        <div className="max-w-2xl space-y-3 sm:space-y-4">

          {/* Project name */}
          <h1 className="text-4xl sm:text-5xl lg:text-[4.5rem] font-bold text-white leading-[1.05] tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
            {projectName || "Project Name"}
          </h1>

          {/* Tagline */}
          {tagline && (
            <p className="inline-block px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white text-base sm:text-lg font-light leading-snug">
              {tagline}
            </p>
          )}

          {/* Stat pills */}
          {stats.length > 0 && (
            <div className="flex gap-2 flex-wrap pt-1">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 shrink-0"
                >
                  <stat.icon className="h-3.5 w-3.5 text-primary shrink-0" />
                  <div>
                    <p className="text-white/70 text-[9px] uppercase tracking-wider leading-none mb-0.5">{stat.label}</p>
                    <p className="text-white font-semibold text-[13px] leading-none whitespace-nowrap">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="w-12 h-px bg-primary/80" />

        </div>
      </div>

      {/* Mobile WhatsApp CTA — pinned above bottom safe area */}
      <div
        className="sm:hidden absolute left-4 right-4 z-20"
        style={{ bottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      >
        <a
          href={`https://wa.me/${waNumber}?text=${waMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2.5 w-full py-4 rounded-2xl text-white font-bold text-base shadow-2xl touch-manipulation active:scale-[0.98] transition-transform"
          style={{ backgroundColor: "#25D366" }}
        >
          <MessageCircle className="h-5 w-5" />
          I'm Interested
        </a>
      </div>

      {/* Scroll indicator — centered, above mobile CTA */}
      <div className="absolute bottom-28 sm:bottom-6 left-0 right-0 flex flex-col items-center gap-1 animate-bounce z-10 pointer-events-none">
        <span className="text-white/70 text-[10px] uppercase tracking-widest drop-shadow-md">Scroll</span>
        <ChevronDown className="h-5 w-5 text-white/70 drop-shadow-md" />
      </div>
    </section>
  );
}
