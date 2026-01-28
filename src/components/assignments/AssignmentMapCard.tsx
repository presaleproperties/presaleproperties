import { Bed, Bath, Square } from "lucide-react";
import { Link } from "react-router-dom";
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
  listing_photos?: { url: string; sort_order: number | null }[];
}

interface AssignmentMapCardProps {
  assignment: Assignment;
  isFocused?: boolean;
  isSelected?: boolean;
  onClick?: (e?: React.MouseEvent) => void;
  className?: string;
  variant?: "carousel" | "grid";
}

function formatPrice(price: number): string {
  return `$${price.toLocaleString()}`;
}

/**
 * Full assignment card shown to verified agents.
 * Displays all details including price, location, and specs.
 */
export function AssignmentMapCard({
  assignment,
  isFocused = false,
  isSelected = false,
  onClick,
  className,
  variant = "grid",
}: AssignmentMapCardProps) {
  const photo = assignment.listing_photos?.[0]?.url;
  const savings = assignment.original_price 
    ? assignment.original_price - assignment.assignment_price 
    : null;
  
  const isCarousel = variant === "carousel";
  
  return (
    <Link 
      to={`/assignments/${assignment.id}`}
      onClick={onClick}
      className={cn(
        "relative rounded-xl border overflow-hidden transition-all group bg-card block",
        isFocused 
          ? "border-[hsl(18,85%,50%)] ring-2 ring-[hsl(18,85%,50%)]/30 shadow-lg" 
          : isSelected 
            ? "border-[hsl(18,85%,50%)]/50 ring-1 ring-[hsl(18,85%,50%)]/20" 
            : "border-border hover:border-[hsl(18,85%,50%)]/50 hover:shadow-lg",
        isCarousel ? "w-[280px] shrink-0" : "",
        className
      )}
    >
      {/* Image Section */}
      <div className={cn(
        "relative bg-muted overflow-hidden",
        isCarousel ? "aspect-[4/3]" : "aspect-[3/2]"
      )}>
        {photo ? (
          <img 
            src={photo} 
            alt={assignment.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[hsl(18,50%,95%)] to-[hsl(18,40%,90%)] dark:from-[hsl(18,40%,20%)] dark:to-[hsl(18,30%,15%)] flex items-center justify-center">
            <span className="text-muted-foreground text-sm">No Image</span>
          </div>
        )}
        
        {/* Assignment Badge */}
        <span className="absolute top-2 left-2 bg-[hsl(18,85%,50%)] text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide">
          Assignment
        </span>
        
        {/* Savings Badge */}
        {savings && savings > 0 && (
          <span className="absolute top-2 right-2 bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded-md">
            Save ${Math.round(savings / 1000)}K
          </span>
        )}
      </div>
      
      {/* Content Section */}
      <div className="p-3">
        {/* Price */}
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-bold text-lg text-foreground">
            {formatPrice(assignment.assignment_price)}
          </span>
          {assignment.original_price && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(assignment.original_price)}
            </span>
          )}
        </div>
        
        {/* Project Name */}
        <p className="text-sm font-medium text-foreground truncate mb-0.5">
          {assignment.project_name}
        </p>
        
        {/* Location */}
        <p className="text-xs text-muted-foreground truncate mb-2">
          {assignment.neighborhood ? `${assignment.neighborhood}, ` : ""}{assignment.city}
        </p>
        
        {/* Specs */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Bed className="h-3 w-3" />
            {assignment.beds} bd
          </span>
          <span className="flex items-center gap-1">
            <Bath className="h-3 w-3" />
            {assignment.baths} ba
          </span>
          {assignment.interior_sqft && (
            <span className="flex items-center gap-1">
              <Square className="h-3 w-3" />
              {assignment.interior_sqft.toLocaleString()} sqft
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
