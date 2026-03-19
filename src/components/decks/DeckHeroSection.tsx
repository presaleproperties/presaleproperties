import { ChevronDown, Layers, Calendar, Users, DollarSign, Tag } from "lucide-react";

interface DeckHeroSectionProps {
  projectName: string;
  tagline?: string;
  heroImageUrl?: string;
  developerName?: string;
  stories?: number;
  totalUnits?: number;
  completionYear?: string;
  assignmentFee?: string;
  whatsappNumber?: string;
  city?: string;
  neighborhood?: string;
  startingPrice?: string;
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
  assignmentFee,
  city,
  neighborhood,
  startingPrice,
  onFloorPlansClick,
}: DeckHeroSectionProps) {
  const locationLabel = neighborhood && city
    ? `${neighborhood}, ${city}`
    : neighborhood || city || null;

  const stats = [
    startingPrice && { icon: Tag, label: "Starting From", value: startingPrice },
    stories && { icon: Layers, label: "Stories", value: `${stories} Floors` },
    totalUnits && { icon: Users, label: "Total Units", value: `${totalUnits}` },
    completionYear && { icon: Calendar, label: "Completion", value: completionYear },
    assignmentFee && { icon: DollarSign, label: "Assignment Fee", value: assignmentFee },
  ].filter(Boolean) as { icon: any; label: string; value: string }[];

  return (
    <section
      id="overview"
      className="relative flex flex-col justify-end overflow-hidden"
      style={{ height: "100dvh" }}
    >
      {/* Background image */}
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pb-28 sm:pb-24 pt-28 w-full">
        <div className="max-w-2xl space-y-4">

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

          {/* Divider */}
          <div className="w-12 h-px bg-primary/80" />

          {/* Stat pills */}
          {stats.length > 0 && (
            <div className="flex gap-2 flex-wrap">
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
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="hidden sm:flex absolute bottom-6 left-0 right-0 flex-col items-center gap-1 z-10 cursor-pointer"
        onClick={onFloorPlansClick}
      >
        <span className="text-white/70 text-[10px] font-semibold uppercase tracking-widest drop-shadow-md">Scroll to explore</span>
        <ChevronDown className="h-5 w-5 text-white/60 drop-shadow-md animate-bounce" />
      </div>
    </section>
  );
}
