import { Link } from "react-router-dom";
import { MapPin, Bed, Bath, Maximize, Camera, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SaveButton } from "./SaveButton";

interface AgentInfo {
  name?: string;
  brokerage?: string;
  avatarUrl?: string;
}

interface ListingCardProps {
  id: string;
  title: string;
  projectName: string;
  address?: string;
  city: string;
  neighborhood?: string;
  propertyType: string;
  unitType: string;
  beds: number;
  baths: number;
  interiorSqft?: number;
  assignmentPrice: number;
  completionYear?: number;
  completionMonth?: number;
  isFeatured?: boolean;
  imageUrl?: string;
  photoCount?: number;
  agent?: AgentInfo;
  visibilityMode?: "public" | "restricted";
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(price);
};

const formatUnitType = (type: string) => {
  const map: Record<string, string> = {
    studio: "Studio",
    "1bed": "1 Bed",
    "1bed_den": "1 Bed + Den",
    "2bed": "2 Bed",
    "2bed_den": "2 Bed + Den",
    "3bed": "3 Bed",
    penthouse: "Penthouse",
  };
  return map[type] || type;
};

export function ListingCard({
  id,
  title,
  projectName,
  address,
  city,
  neighborhood,
  beds,
  baths,
  interiorSqft,
  assignmentPrice,
  completionYear,
  completionMonth,
  isFeatured,
  imageUrl,
  photoCount = 0,
  agent,
  visibilityMode = "public",
}: ListingCardProps) {
  const isRestricted = visibilityMode === "restricted";
  const displayTitle = isRestricted ? "Presale Condo Assignment – Vancouver" : projectName;
  const displaySubtitle = isRestricted ? `${formatUnitType(beds === 0 ? "studio" : `${beds}bed`)} in ${city}` : title;

  return (
    <Link to={`/assignments/${id}`}>
      <Card className="group overflow-hidden border-border bg-card shadow-card hover:shadow-[0_8px_30px_rgb(0,0,0,0.08),0_0_0_1px_hsl(var(--primary)/0.1)] hover:border-primary/30 hover:-translate-y-1.5 transition-all duration-300 ease-out">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={displayTitle}
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <span className="text-muted-foreground text-sm">No image</span>
            </div>
          )}
          
          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Badges - Top Left */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {isFeatured && (
              <Badge className="bg-primary text-primary-foreground shadow-gold">
                Featured
              </Badge>
            )}
            {isRestricted && (
              <Badge variant="secondary" className="bg-amber-500/90 text-white gap-1">
                <Lock className="h-3 w-3" />
                Restricted
              </Badge>
            )}
          </div>

          {/* Save Button - Top Right */}
          <div className="absolute top-3 right-3">
            <SaveButton listingId={id} />
          </div>

          {/* Photo Count - Bottom Right */}
          {photoCount > 0 && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded-md backdrop-blur-sm">
              <Camera className="h-3.5 w-3.5" />
              <span>{photoCount}</span>
            </div>
          )}
        </div>

        <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
          <div className="flex items-start gap-1.5 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 mt-0.5 shrink-0" />
            <span className="text-xs sm:text-sm truncate">
              {isRestricted ? city : (address || neighborhood || city)}
            </span>
          </div>

          <div>
            <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors duration-200 text-sm sm:text-base">
              {displayTitle}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">{displaySubtitle}</p>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Bed className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {beds}
            </span>
            <span className="flex items-center gap-1">
              <Bath className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {baths}
            </span>
            {interiorSqft && (
              <span className="flex items-center gap-1">
                <Maximize className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {interiorSqft} sqft
              </span>
            )}
          </div>

          <div className="flex items-end justify-between pt-2 border-t border-border">
            <div>
              <p className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors duration-200">
                {formatPrice(assignmentPrice)}
              </p>
            </div>
            <span className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {city}
            </span>
          </div>

          {/* Agent Info */}
          {agent && (
            <div className="flex items-center gap-2 pt-3 border-t border-border">
              <Avatar className="h-8 w-8 ring-2 ring-transparent group-hover:ring-primary/20 transition-all duration-200">
                <AvatarImage src={agent.avatarUrl} alt={agent.name || "Agent"} />
                <AvatarFallback className="text-xs bg-muted">
                  {agent.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "AG"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">
                  {agent.name || "Agent"}
                </p>
                {agent.brokerage && (
                  <p className="text-xs text-muted-foreground truncate">
                    {agent.brokerage}
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
