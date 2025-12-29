import { Link } from "react-router-dom";
import { MapPin, Calendar, Building2 } from "lucide-react";
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
      return "Selling Now";
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
      return "bg-green-500 text-white";
    case "registering":
      return "bg-primary text-primary-foreground";
    case "coming_soon":
      return "bg-blue-500 text-white";
    case "sold_out":
      return "bg-muted-foreground text-white";
    default:
      return "bg-primary text-primary-foreground";
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

  const formatVerifiedDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isLarge = size === "large";

  return (
    <Link 
      to={`/presale-projects/${slug}`} 
      onClick={handleCardTap}
      className={cn(
        "block shrink-0",
        isLarge ? "w-[220px] sm:w-[260px]" : "w-[165px] sm:w-[180px]"
      )}
    >
      <div className="bg-card rounded-xl overflow-hidden border border-border shadow-sm active:shadow-none active:scale-[0.98] transition-all duration-150">
        {/* Image */}
        <div className={cn(
          "relative bg-muted overflow-hidden",
          isLarge ? "aspect-[16/10]" : "aspect-[4/3]"
        )}>
          {featuredImage ? (
            <img
              src={featuredImage}
              alt={name}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
              sizes={isLarge ? "(max-width: 640px) 220px, 260px" : "(max-width: 640px) 165px, 180px"}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <Building2 className={cn("text-muted-foreground", isLarge ? "h-12 w-12" : "h-8 w-8")} />
            </div>
          )}
          
          {/* Status Badge */}
          {statusLabel && (
            <Badge className={cn(
              "absolute top-2 left-2 px-2 py-0.5",
              isLarge ? "text-xs" : "text-[10px] px-1.5",
              getStatusColor(status)
            )}>
              {statusLabel}
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className={cn("space-y-1.5", isLarge ? "p-3" : "p-2.5")}>
          {/* Name & Area */}
          <div>
            <h4 className={cn(
              "font-semibold text-foreground line-clamp-1",
              isLarge ? "text-base" : "text-sm"
            )}>{name}</h4>
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="text-xs truncate">{neighborhood}</span>
            </div>
          </div>

          {/* Price */}
          <div>
            {startingPrice ? (
              <p className={cn(
                "font-bold text-foreground",
                isLarge ? "text-base" : "text-sm"
              )}>
                From {formatPrice(startingPrice)}
              </p>
            ) : (
              <p className="text-xs text-primary font-medium">
                Register for pricing
              </p>
            )}
          </div>

          {/* Key Info Row */}
          <div className="flex items-center justify-between pt-1.5 border-t border-border">
            {/* Deposit */}
            {depositPercent && (
              <span className={cn(
                "font-bold text-foreground",
                isLarge ? "text-sm" : "text-xs"
              )}>
                {depositPercent}% dep
              </span>
            )}
            
            {/* Completion Year */}
            {completionYear && (
              <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                <Calendar className="h-3 w-3" />
                {completionYear}
              </span>
            )}
          </div>

          {/* Last Verified */}
          {lastVerifiedDate && (
            <p className="text-[10px] text-muted-foreground/70">
              Verified {formatVerifiedDate(lastVerifiedDate)}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
