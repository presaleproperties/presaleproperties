import { Link } from "react-router-dom";
import { MapPin, Bed, Bath, Maximize, Camera } from "lucide-react";
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
}: ListingCardProps) {
  const completionDate = completionYear
    ? `${completionMonth ? `${completionMonth}/` : ""}${completionYear}`
    : null;

  return (
    <Link to={`/assignments/${id}`}>
      <Card className="group overflow-hidden border-border bg-card shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 ease-out">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <span className="text-muted-foreground text-sm">No image</span>
            </div>
          )}
          
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
          
          {/* Badges - Top Left */}
          {isFeatured && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-primary text-primary-foreground shadow-gold">
                Featured
              </Badge>
            </div>
          )}

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

        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-1.5 text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
            <span className="text-sm truncate">
              {address || neighborhood || city}
            </span>
          </div>

          <div>
            <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors duration-200">
              {projectName}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-1">{title}</p>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Bed className="h-4 w-4" />
              {beds}
            </span>
            <span className="flex items-center gap-1">
              <Bath className="h-4 w-4" />
              {baths}
            </span>
            {interiorSqft && (
              <span className="flex items-center gap-1">
                <Maximize className="h-4 w-4" />
                {interiorSqft} sqft
              </span>
            )}
          </div>

          <div className="flex items-end justify-between pt-2 border-t border-border">
            <div>
              <p className="text-lg font-bold text-foreground group-hover:text-primary transition-colors duration-200">
                {formatPrice(assignmentPrice)}
              </p>
            </div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
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
