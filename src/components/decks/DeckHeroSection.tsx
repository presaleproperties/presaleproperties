import { ChevronDown, Building2, Calendar, DollarSign, MapPin, Tag } from "lucide-react";

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

  // Only show the most important stats — keep it lean
  const stats = [
    locationLabel && { icon: MapPin, label: "Location", value: locationLabel },
    startingPrice && { icon: Tag, label: "From", value: startingPrice },
    completionYear && { icon: Calendar, label: "Completion", value: completionYear },
    developerName && { icon: Building2, label: "Developer", value: developerName },
    assignmentFee && { icon: DollarSign, label: "Assignment", value: assignmentFee },
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-10 pb-24 sm:pb-20 pt-28 w-full">
        <div className="max-w-xl space-y-5">

          {/* Project name */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.05] tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)]">
            {projectName || "Project Name"}
          </h1>

          {/* Tagline */}
          {tagline && (
            <p className="text-white/80 text-base sm:text-lg font-light leading-snug">
              {tagline}
            </p>
          )}

          {/* Slim divider */}
          <div className="w-10 h-0.5 bg-primary/90 rounded-full" />

          {/* Stat pills — horizontal, compact */}
          {stats.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/55 backdrop-blur-sm border border-white/15 shrink-0"
                >
                  <stat.icon className="h-3 w-3 text-primary/90 shrink-0" />
                  <span className="text-white/60 text-[10px] uppercase tracking-wider hidden sm:inline">{stat.label}:</span>
                  <span className="text-white font-medium text-xs leading-none">{stat.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="hidden sm:flex absolute bottom-6 left-0 right-0 flex-col items-center gap-1.5 z-10 cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
        onClick={onFloorPlansClick}
      >
        <span className="text-white/60 text-[10px] font-medium uppercase tracking-widest">Scroll to explore</span>
        <ChevronDown className="h-4 w-4 text-white/50 animate-bounce" />
      </div>
    </section>
  );
}
