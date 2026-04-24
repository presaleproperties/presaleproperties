import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Bed, Bath, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface Assignment {
  id: string;
  title: string;
  project_name: string;
  city: string;
  neighborhood: string | null;
  assignment_price: number;
  original_price: number | null;
  beds: number;
  baths: number;
  interior_sqft: number | null;
  map_lat: number | null;
  map_lng: number | null;
  status?: string;
  listing_photos?: { url: string }[];
}

interface AssignmentMapCardProps {
  assignment: Assignment;
  isVerifiedAgent?: boolean;
  isFocused?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(price);
};

export function AssignmentMapCard({ 
  assignment, 
  isFocused,
  onClick,
  className 
}: AssignmentMapCardProps) {
  const photo = assignment.listing_photos?.[0]?.url;
  const savings = assignment.original_price 
    ? assignment.original_price - assignment.assignment_price 
    : 0;

  return (
    <Link 
      to={`/assignments/${assignment.id}`}
      onClick={onClick}
      className="block"
    >
      <Card className={cn(
        "overflow-hidden transition-all duration-200 h-full",
        isFocused && "ring-2 ring-warning shadow-lg",
        className
      )}>
        <CardContent className="p-0">
          <div className="relative h-32 bg-muted">
            {photo ? (
              <img 
                src={photo} 
                alt={assignment.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                <MapPin className="h-8 w-8 text-muted-foreground/30" />
              </div>
            )}
            
            {savings > 0 && (
              <Badge className="absolute top-2 left-2 bg-success hover:bg-success text-on-dark text-[10px] px-2">
                Save {formatPrice(savings)}
              </Badge>
            )}
            
            <Badge className="absolute top-2 right-2 bg-warning hover:bg-warning text-on-dark text-[10px] px-2">
              Assignment
            </Badge>
          </div>
          
          <div className="p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-base text-foreground">
                {formatPrice(assignment.assignment_price)}
              </span>
            </div>
            
            <p className="font-medium text-sm truncate">
              {assignment.project_name}
            </p>
            
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {assignment.neighborhood || assignment.city}
            </div>
            
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Bed className="h-3 w-3" />
                {assignment.beds}
              </span>
              <span className="flex items-center gap-1">
                <Bath className="h-3 w-3" />
                {assignment.baths}
              </span>
              {assignment.interior_sqft && (
                <span className="flex items-center gap-1">
                  <Square className="h-3 w-3" />
                  {assignment.interior_sqft} sqft
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
