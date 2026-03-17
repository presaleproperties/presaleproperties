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
      className="relative min-h-[100dvh] flex flex-col justify-end overflow-hidden"
    >
      {/* Background image — minimal vignette only */}
      <div className="absolute inset-0 z-0">
        {heroImageUrl ? (
          <img
            src={heroImageUrl}
            alt={projectName}
            className="w-full h-full object-cover object-center"
            loading="eager"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-muted/80" />
        )}
        {/* Soft vignette — just enough to anchor the bottom content */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
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

      {/* Content — stacked text with individual dark backgrounds */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pb-16 sm:pb-20 pt-28 w-full">
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

          {/* CTAs */}
          <div className="flex flex-col gap-3 w-full sm:flex-row">
            <a
              href={`https://wa.me/${waNumber}?text=${waMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 py-3.5 px-7 rounded-xl font-bold text-sm text-white shadow-lg touch-manipulation transition-all active:scale-[0.98] w-full sm:w-auto"
              style={{ background: "#25D366", boxShadow: "0 4px 24px rgba(37,211,102,0.35)" }}
            >
              <MessageCircle className="h-5 w-5 shrink-0" />
              I'm Interested
            </a>

            <Button
              size="lg"
              variant="outline"
              onClick={onFloorPlansClick}
              className="py-3.5 sm:px-8 bg-black/50 border-white/35 text-white hover:bg-black/70 hover:border-white/55 hover:text-white text-sm font-semibold backdrop-blur-sm w-full sm:w-auto"
            >
              View Floor Plans & Pricing
            </Button>
          </div>

          {/* Micro-copy */}
          <p className="inline-block px-2 py-1 rounded bg-black/40 backdrop-blur-sm text-white/80 text-xs">
            No obligation · Respond in minutes · Private pricing available
          </p>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 animate-bounce">
        <span className="text-white/70 text-[10px] uppercase tracking-widest drop-shadow-md">Scroll</span>
        <ChevronDown className="h-5 w-5 text-white/70 drop-shadow-md" />
      </div>
    </section>
  );
}
