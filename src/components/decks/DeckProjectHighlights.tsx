import { Building2, Layers, Users, Calendar, MapPin, Navigation } from "lucide-react";

interface ProximityHighlight {
  icon?: string;
  label: string;
  distance?: string | number;
}

interface DeckProjectHighlightsProps {
  developerName?: string;
  stories?: number;
  totalUnits?: number;
  completionYear?: string;
  city?: string;
  address?: string;
  neighborhood?: string;
  proximityHighlights?: ProximityHighlight[];
}

export function DeckProjectHighlights({
  developerName,
  stories,
  totalUnits,
  completionYear,
  city,
  address,
  neighborhood,
  proximityHighlights = [],
}: DeckProjectHighlightsProps) {
  const stats = [
    developerName && { icon: Building2, label: "Developer", value: developerName },
    stories && { icon: Layers, label: "Stories", value: `${stories} Floors` },
    totalUnits && { icon: Users, label: "Total Units", value: totalUnits.toString() },
    completionYear && { icon: Calendar, label: "Completion", value: completionYear },
    (address || city) && { icon: MapPin, label: "Location", value: address || city || "" },
  ].filter(Boolean) as { icon: any; label: string; value: string }[];

  if (stats.length === 0 && proximityHighlights.length === 0) return null;

  return (
    <section id="project-highlights" className="deck-animate bg-background border-b border-border/30 py-12 sm:py-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="space-y-8">

          {/* Section label */}
          <div className="space-y-1.5">
            <p className="text-primary text-[11px] font-bold uppercase tracking-[0.25em]">01 — The Development</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Project Details</h2>
          </div>

          {/* Stats grid */}
          {stats.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col gap-3 px-5 py-5 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors duration-200"
                >
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/8 shrink-0">
                    <stat.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-semibold leading-none mb-1.5">
                      {stat.label}
                    </p>
                    <p className="text-[15px] font-bold text-foreground leading-snug break-words">
                      {stat.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Proximity highlights */}
          {proximityHighlights.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Navigation className="h-3.5 w-3.5 text-primary" />
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">What's Nearby</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {proximityHighlights.map((h, i) => (
                  <div
                    key={i}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-card border border-border/50 hover:border-primary/30 transition-colors duration-200"
                  >
                    {h.icon && <span className="text-base leading-none">{h.icon}</span>}
                    <span className="text-sm font-medium text-foreground">{h.label}</span>
                    {h.distance && (
                      <span className="text-sm text-primary font-semibold">
                        · {h.distance}{typeof h.distance === "number" ? " min" : ""}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
