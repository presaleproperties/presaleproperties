import { Building2, MapPin, Flame, ArrowRight, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface VipProjectCardProps {
  listing: {
    id: string;
    linked_project_name: string;
    linked_project_slug: string;
    developer_name: string | null;
    available_units: number;
    total_units: number;
    construction_stage: string | null;
    incentives: string | null;
  };
  project?: {
    city?: string;
    neighborhood?: string;
    featured_image?: string;
    completion_year?: string;
    project_type?: string;
  };
  minPrice?: number;
  onClick: () => void;
}

const STAGE_LABELS: Record<string, string> = {
  "pre-construction": "Pre-Construction",
  excavation: "Excavation",
  foundation: "Foundation",
  framing: "Framing",
  finishing: "Finishing",
  "move-in-ready": "Move-In Ready",
};

export function VipProjectCard({ listing, project, minPrice, onClick }: VipProjectCardProps) {
  const location = [project?.neighborhood, project?.city].filter(Boolean).join(", ");

  return (
    <button
      onClick={onClick}
      className="group relative text-left rounded-2xl overflow-hidden border-2 border-border bg-card hover:border-primary hover:shadow-2xl transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-[0.98] touch-manipulation"
    >
      {/* Image */}
      <div className="relative overflow-hidden bg-muted/20" style={{ aspectRatio: "16/10" }}>
        {project?.featured_image ? (
          <>
            <img
              src={project.featured_image}
              alt={listing.linked_project_name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted/40 to-muted/20">
            <Building2 className="h-12 w-12 text-muted-foreground/20" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {listing.construction_stage && (
            <Badge className="bg-background/90 backdrop-blur-sm text-foreground text-[10px] font-semibold border-none shadow-sm">
              {STAGE_LABELS[listing.construction_stage] || listing.construction_stage}
            </Badge>
          )}
          {listing.incentives && (
            <Badge className="bg-primary/90 text-primary-foreground text-[10px] font-bold border-none shadow-sm">
              INCENTIVES
            </Badge>
          )}
        </div>

        {/* Units badge */}
        <div className="absolute bottom-3 right-3">
          <div className="flex items-center gap-1.5 bg-background/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm">
            <Flame className="h-3 w-3 text-primary" />
            <span className="text-xs font-bold text-foreground">
              {listing.available_units} {listing.available_units === 1 ? "unit" : "units"}
            </span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 sm:p-5 space-y-2.5">
        <div>
          <h3 className="text-lg font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
            {listing.linked_project_name}
          </h3>
          {location && (
            <p className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <MapPin className="h-3 w-3 shrink-0" />
              {location}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/40">
          <div>
            {minPrice ? (
              <>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Starting from</p>
                <p className="text-primary font-bold text-lg leading-tight">${minPrice.toLocaleString()}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Contact for pricing</p>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-sm font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
            View Details
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>

        {listing.developer_name && (
          <p className="text-xs text-muted-foreground">
            By <span className="font-medium text-foreground/70">{listing.developer_name}</span>
          </p>
        )}
      </div>
    </button>
  );
}
