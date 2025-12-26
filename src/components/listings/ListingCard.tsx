import { Link } from "react-router-dom";
import { MapPin, Bed, Bath, Maximize } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

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
}: ListingCardProps) {
  const completionDate = completionYear
    ? `${completionMonth ? `${completionMonth}/` : ""}${completionYear}`
    : null;

  return (
    <Link to={`/assignments/${id}`}>
      <Card className="group overflow-hidden border-border bg-card shadow-card hover:shadow-card-hover transition-all duration-300">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <span className="text-muted-foreground text-sm">No image</span>
            </div>
          )}
          
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge className="bg-success text-success-foreground shadow-sm">
              Available
            </Badge>
            {isFeatured && (
              <Badge className="bg-primary text-primary-foreground shadow-gold">
                Featured
              </Badge>
            )}
          </div>
        </div>

        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-1.5 text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
            <span className="text-sm truncate">
              {address || neighborhood || city}
            </span>
          </div>

          <div>
            <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
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
              <p className="text-lg font-bold text-foreground">
                {formatPrice(assignmentPrice)}
              </p>
              {completionDate && (
                <p className="text-xs text-muted-foreground">
                  Est. {completionDate}
                </p>
              )}
            </div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {city}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}