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
      {/* Background */}
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
      </div>

      {/* Top badge */}
      <div className="absolute top-5 left-4 sm:top-8 sm:left-8 z-10">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/30">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-primary text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest">
            Exclusive Presale Opportunity
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pb-16 sm:pb-20 pt-28 w-full">
        <div className="max-w-4xl space-y-4 sm:space-y-5">
          <p className="text-primary text-[11px] font-bold uppercase tracking-[0.2em] drop-shadow-sm">
            01 — Overview
          </p>

          <h1 className="text-4xl sm:text-5xl lg:text-[4.5rem] font-bold text-white leading-[1.05] tracking-tight">
            {projectName || "Project Name"}
          </h1>

          {tagline && (
            <p className="text-white/90 text-base sm:text-xl font-light max-w-2xl leading-relaxed">
              {tagline}
            </p>
          )}

          {stats.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide pt-1">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/8 backdrop-blur-md border border-white/12 shrink-0"
                >
                  <stat.icon className="h-3.5 w-3.5 text-primary shrink-0" />
                  <div>
                   <p className="text-white/70 text-[9px] uppercase tracking-wider leading-none mb-0.5">{stat.label}</p>
                    <p className="text-white font-semibold text-[12px] leading-none whitespace-nowrap">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="w-12 h-px bg-primary/60" />

          {/* CTAs */}
          <div className="flex flex-col gap-3 pt-1 w-full max-w-sm sm:max-w-none sm:flex-row">
            {/* Primary: WhatsApp text */}
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

            {/* Secondary: Floor plans */}
            <Button
              size="lg"
              variant="outline"
              onClick={onFloorPlansClick}
              className="py-3.5 sm:px-8 bg-white/8 border-white/25 text-white hover:bg-white/15 hover:border-white/40 hover:text-white text-sm font-semibold backdrop-blur-sm w-full sm:w-auto"
            >
              View Floor Plans & Pricing
            </Button>
          </div>

          {/* Micro-copy */}
          <p className="text-white/60 text-xs">
            No obligation · Respond in minutes · Private pricing available
          </p>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 animate-bounce">
        <span className="text-white/60 text-[10px] uppercase tracking-widest">Scroll</span>
        <ChevronDown className="h-5 w-5 text-white/60" />
      </div>
    </section>
  );
}
