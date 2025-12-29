import { Link } from "react-router-dom";
import { Calendar, Building2, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MobileProjectCardProps {
  id: string;
  slug: string;
  name: string;
  city: string;
  neighborhood: string;
  projectType: "condo" | "townhome" | "mixed" | "duplex" | "single_family";
  status?: "coming_soon" | "registering" | "active" | "sold_out";
  completionYear?: number | null;
  startingPrice?: number | null;
  depositPercent?: number | null;
  featuredImage?: string | null;
  lastVerifiedDate?: string | null;
  size?: "default" | "large";
}

const formatPrice = (price: number) => {
  if (price >= 1000000) {
    return `$${(price / 1000000).toFixed(1)}M`;
  }
  return `$${(price / 1000).toFixed(0)}K`;
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "active":
      return "Selling";
    case "registering":
      return "Registering";
    case "coming_soon":
      return "Coming Soon";
    case "sold_out":
      return "Sold Out";
    default:
      return null;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-500/90 text-white";
    case "registering":
      return "bg-blue-500/90 text-white";
    case "coming_soon":
      return "bg-amber-500/90 text-white";
    case "sold_out":
      return "bg-gray-500/90 text-white";
    default:
      return "bg-primary text-primary-foreground";
  }
};

const getProjectTypeLabel = (type: string) => {
  switch (type) {
    case "condo":
      return "Condo";
    case "townhome":
      return "Townhome";
    case "mixed":
      return "Mixed";
    case "duplex":
      return "Duplex";
    case "single_family":
      return "House";
    default:
      return type;
  }
};

export function MobileProjectCard({
  id,
  slug,
  name,
  city,
  neighborhood,
  projectType,
  status = "coming_soon",
  completionYear,
  startingPrice,
  depositPercent,
  featuredImage,
  lastVerifiedDate,
  size = "default",
}: MobileProjectCardProps) {
  const statusLabel = getStatusLabel(status);

  const handleCardTap = () => {
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "project_card_tap", {
        project_id: id,
        project_name: name,
        project_city: city,
      });
    }
  };

  const isLarge = size === "large";

  return (
    <Link 
      to={`/presale-projects/${slug}`} 
      onClick={handleCardTap}
      className={cn(
        "block shrink-0",
        isLarge ? "w-[240px]" : "w-[200px]"
      )}
    >
      <div className="bg-card rounded-xl overflow-hidden border border-border shadow-sm active:scale-[0.98] transition-transform duration-150">
        {/* Wider Image - ~65% of card height */}
        <div className={cn(
          "relative bg-muted overflow-hidden",
          isLarge ? "aspect-[16/12]" : "aspect-[16/11]"
        )}>
          {featuredImage ? (
            <img
              src={featuredImage}
              alt={name}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <Building2 className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
          
          {/* Status Badge - top left */}
          {statusLabel && (
            <Badge className={cn(
              "absolute top-2 left-2 px-2 py-0.5 text-[10px] font-semibold border-0",
              getStatusColor(status)
            )}>
              {statusLabel}
            </Badge>
          )}

          {/* Deposit badge - bottom right on image */}
          {depositPercent && (
            <div className="absolute bottom-2 right-2">
              <span className="text-[11px] font-bold text-white bg-primary/90 px-2 py-1 rounded shadow-sm">
                {depositPercent}% Deposit
              </span>
            </div>
          )}
        </div>

        {/* Project Details - ~35% of card */}
        <div className="px-3 py-2.5 space-y-1.5">
          {/* Name */}
          <h4 className="font-semibold text-sm text-foreground line-clamp-1 leading-tight">{name}</h4>
          
          {/* Location */}
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="text-xs truncate">{neighborhood}, {city}</span>
          </div>

          {/* Price & Type Row */}
          <div className="flex items-center justify-between">
            {startingPrice ? (
              <span className="text-sm font-bold text-foreground">
                From {formatPrice(startingPrice)}
              </span>
            ) : (
              <span className="text-xs text-primary font-medium">Register for pricing</span>
            )}
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {getProjectTypeLabel(projectType)}
            </span>
          </div>

          {/* Completion Year */}
          {completionYear && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground pt-0.5">
              <Calendar className="h-3 w-3" />
              <span>Est. {completionYear}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
