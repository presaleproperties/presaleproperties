import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Bed, Bath, Square, Lock, Eye } from "lucide-react";
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
  isVerifiedAgent: boolean;
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
  isVerifiedAgent, 
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
      to={isVerifiedAgent ? `/assignments/${assignment.id}` : "#"}
      onClick={onClick}
      className={cn("block", !isVerifiedAgent && "cursor-default")}
    >
      <Card className={cn(
        "overflow-hidden transition-all duration-200 h-full",
        isFocused && "ring-2 ring-amber-500 shadow-lg",
        className
      )}>
        <CardContent className="p-0">
          {/* Image Section */}
          <div className="relative h-32 bg-muted">
            {photo ? (
              <img 
                src={photo} 
                alt={assignment.title}
                className={cn(
                  "w-full h-full object-cover",
                  !isVerifiedAgent && "blur-lg"
                )}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                <MapPin className="h-8 w-8 text-muted-foreground/30" />
              </div>
            )}
            
            {/* Savings Badge */}
            {savings > 0 && isVerifiedAgent && (
              <Badge className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] px-2">
                Save {formatPrice(savings)}
              </Badge>
            )}
            
            {/* Assignment Badge */}
            <Badge className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] px-2">
              Assignment
            </Badge>
            
            {/* Blur overlay for non-verified */}
            {!isVerifiedAgent && (
              <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center">
                  <Lock className="h-6 w-6 text-white mx-auto mb-1" />
                  <p className="text-[10px] text-white font-medium">Agent Access Only</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Content Section */}
          <div className={cn(
            "p-3 space-y-1.5",
            !isVerifiedAgent && "relative"
          )}>
            {/* Blur overlay for content */}
            {!isVerifiedAgent && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-10">
                <div className="text-center px-4">
                  <Eye className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">
                    Verify as agent to view details
                  </p>
                </div>
              </div>
            )}
            
            {/* Price */}
            <div className="flex items-center justify-between">
              <span className={cn(
                "font-bold text-base",
                isVerifiedAgent ? "text-amber-600" : "blur-sm"
              )}>
                {formatPrice(assignment.assignment_price)}
              </span>
            </div>
            
            {/* Project Name */}
            <p className={cn(
              "font-medium text-sm truncate",
              !isVerifiedAgent && "blur-sm"
            )}>
              {assignment.project_name}
            </p>
            
            {/* Location */}
            <div className={cn(
              "flex items-center gap-1 text-xs text-muted-foreground",
              !isVerifiedAgent && "blur-sm"
            )}>
              <MapPin className="h-3 w-3" />
              {assignment.neighborhood || assignment.city}
            </div>
            
            {/* Specs */}
            <div className={cn(
              "flex items-center gap-3 text-xs text-muted-foreground",
              !isVerifiedAgent && "blur-sm"
            )}>
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