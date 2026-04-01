import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, Unlock, Building2, MapPin } from "lucide-react";

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
    <div className="group rounded-xl border border-[#1e1e1e] bg-[#141414] overflow-hidden transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_30px_-10px_hsl(40_65%_55%/0.2)]">
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden">
        {projectData?.featured_image ? (
          <img
            src={projectData.featured_image}
            alt={listing.linked_project_name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-[#1e1e1e] flex items-center justify-center">
            <Building2 className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground font-semibold text-xs">
          EXCLUSIVE
        </Badge>
        {listing.construction_stage && (
          <Badge variant="secondary" className="absolute top-3 right-3 text-xs">
            {stageLabels[listing.construction_stage] || listing.construction_stage}
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <h3 className="text-lg font-bold text-foreground line-clamp-1">
          {listing.linked_project_name}
        </h3>

        {projectData?.city && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {projectData.neighborhood ? `${projectData.neighborhood}, ${projectData.city}` : projectData.city}
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          {projectData?.project_type && (
            <Badge variant="outline" className="text-xs capitalize border-[#1e1e1e]">
              {projectData.project_type}
            </Badge>
          )}
          {projectData?.completion_year && (
            <Badge variant="outline" className="text-xs border-[#1e1e1e]">
              {projectData.completion_year}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between pt-1">
          {displayPrice ? (
            <p className="text-primary font-bold text-lg">
              From ${displayPrice.toLocaleString()}
            </p>
          ) : (
            <p className="text-primary font-semibold text-sm">Contact for Pricing</p>
          )}
          <span className="text-xs text-muted-foreground">
            {listing.available_units} unit{listing.available_units !== 1 ? "s" : ""} available
          </span>
        </div>

        {hasAccess ? (
          <Button onClick={onViewDetails} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" size="sm">
            <Unlock className="h-4 w-4 mr-1" /> View Details
          </Button>
        ) : (
          <Button onClick={onUnlock} className="w-full" size="sm">
            <Lock className="h-4 w-4 mr-1" /> Unlock Details
          </Button>
        )}
      </div>
    </div>
  );
}
