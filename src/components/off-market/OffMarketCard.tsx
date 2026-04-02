import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, Unlock, Building2, MapPin, Calendar, Home, Sparkles } from "lucide-react";

interface OffMarketCardProps {
  listing: {
    id: string;
    linked_project_name: string;
    linked_project_slug: string;
    developer_name?: string | null;
    available_units: number;
    total_units: number;
    construction_stage?: string | null;
    access_level?: string | null;
    auto_approve_access?: boolean;
    incentives?: string | null;
  };
  projectData?: {
    city?: string;
    neighborhood?: string;
    project_type?: string;
    featured_image?: string | null;
    starting_price?: number | null;
    completion_year?: number | null;
  } | null;
  minPrice?: number | null;
  hasAccess: boolean;
  onUnlock: () => void;
  onViewDetails: () => void;
}

const stageLabels: Record<string, string> = {
  "pre-construction": "Pre-Construction",
  excavation: "Excavation",
  foundation: "Foundation",
  framing: "Framing",
  finishing: "Finishing",
  "move-in-ready": "Move-In Ready",
};

export function OffMarketCard({ listing, projectData, minPrice, hasAccess, onUnlock, onViewDetails }: OffMarketCardProps) {
  const displayPrice = minPrice || projectData?.starting_price;

  return (
    <div className="group relative rounded-2xl border border-border/60 bg-card overflow-hidden transition-all duration-500 hover:border-primary/40 hover:shadow-[0_8px_40px_-12px_hsl(var(--primary)/0.25)]">
      {/* Gold accent top line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden">
        {projectData?.featured_image ? (
          <img
            src={projectData.featured_image}
            alt={listing.linked_project_name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Building2 className="h-12 w-12 text-muted-foreground/20" />
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Top badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
          <Badge className="bg-primary text-primary-foreground font-bold text-[10px] tracking-wider px-2.5 py-0.5 shadow-lg">
            <Sparkles className="h-3 w-3 mr-1" /> VIP EXCLUSIVE
          </Badge>
          {listing.construction_stage && (
            <Badge className="bg-background/80 backdrop-blur-sm text-foreground text-[10px] border border-border/50">
              {stageLabels[listing.construction_stage] || listing.construction_stage}
            </Badge>
          )}
        </div>

        {/* Bottom overlay info */}
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-lg font-bold text-white line-clamp-1 drop-shadow-md">
            {listing.linked_project_name}
          </h3>
          {projectData?.city && (
            <div className="flex items-center gap-1 text-white/80 text-sm mt-0.5">
              <MapPin className="h-3 w-3" />
              {projectData.neighborhood ? `${projectData.neighborhood}, ${projectData.city}` : projectData.city}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Meta tags */}
        <div className="flex items-center gap-2 flex-wrap">
          {projectData?.project_type && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Home className="h-3 w-3" />
              <span className="capitalize">{projectData.project_type}</span>
            </div>
          )}
          {projectData?.completion_year && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{projectData.completion_year}</span>
            </div>
          )}
          {listing.developer_name && (
            <span className="text-xs text-muted-foreground">
              by {listing.developer_name}
            </span>
          )}
        </div>

        {/* Price & units row */}
        <div className="flex items-end justify-between">
          {displayPrice ? (
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Starting from</p>
              <p className="text-primary font-bold text-xl leading-tight">
                ${displayPrice.toLocaleString()}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-primary font-semibold text-sm">Contact for Pricing</p>
            </div>
          )}
          <div className="text-right">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Available</p>
            <p className="text-foreground font-bold text-lg leading-tight">
              {listing.available_units} <span className="text-xs font-normal text-muted-foreground">unit{listing.available_units !== 1 ? "s" : ""}</span>
            </p>
          </div>
        </div>

        {/* Incentive teaser if present */}
        {listing.incentives && (
          <div className="flex items-center gap-1.5 text-xs text-primary bg-primary/8 rounded-lg px-3 py-1.5 border border-primary/15">
            <Sparkles className="h-3 w-3 flex-shrink-0" />
            <span className="font-medium truncate">Developer incentive available</span>
          </div>
        )}

        {/* CTA */}
        {hasAccess ? (
          <Button onClick={onViewDetails} className="w-full h-11 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 font-semibold" variant="ghost">
            <Unlock className="h-4 w-4 mr-1.5" /> View Full Details
          </Button>
        ) : (
          <Button onClick={onUnlock} className="w-full h-11 rounded-xl font-semibold shadow-md hover:shadow-lg transition-shadow">
            <Lock className="h-4 w-4 mr-1.5" /> Unlock VIP Details
          </Button>
        )}
      </div>
    </div>
  );
}
