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
            className="w-full h-full object-cover"
            style={{ objectPosition: 'center 30%' }}
            loading="eager"
            fetchPriority="high"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-muted/80" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/80 via-neutral-900/20 to-neutral-900/5" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pb-28 sm:pb-24 pt-28 w-full">
        <div className="max-w-2xl space-y-5">

          {/* Developer badge */}
          {developerName && (
            <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.25em] text-on-dark/60">
              By {developerName}
            </span>
          )}

          {/* Project name */}
          <h1 className="text-4xl sm:text-5xl lg:text-[4.5rem] font-bold text-on-dark leading-[1.05] tracking-tight">
            {projectName || "Project Name"}
          </h1>

          {/* Tagline */}
          {tagline && (
            <p className="text-on-dark/80 text-lg sm:text-xl font-light leading-snug max-w-lg">
              {tagline}
            </p>
          )}

          {/* Divider */}
          <div className="w-10 h-[2px] bg-primary" />

          {/* Stat pills — frosted glass */}
          {stats.length > 0 && (
            <div className="flex gap-2.5 flex-wrap">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-card/10 backdrop-blur-md border border-card/15 shrink-0"
                >
                  <stat.icon className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <p className="text-on-dark/50 text-[10px] uppercase tracking-[0.15em] font-medium leading-none mb-1">{stat.label}</p>
                    <p className="text-on-dark font-semibold text-sm leading-none whitespace-nowrap">{stat.value}</p>
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
        <span className="text-on-dark/50 text-[10px] font-semibold uppercase tracking-[0.2em]">Scroll to explore</span>
        <ChevronDown className="h-5 w-5 text-on-dark/40 animate-bounce" />
      </div>
    </section>
  );
}
