import { Lock, Bed, Bath, Square } from "lucide-react";
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

interface BlurredAssignmentCardProps {
  assignment: Assignment;
  isFocused?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
  variant?: "carousel" | "grid";
}

/**
 * A blurred assignment card shown to non-verified users.
 * Displays a teaser with obscured details and a CTA to login.
 */
export function BlurredAssignmentCard({
  assignment,
  isFocused = false,
  isSelected = false,
  onClick,
  className,
  variant = "grid",
}: BlurredAssignmentCardProps) {
  const photo = assignment.listing_photos?.[0]?.url;
  
  const isCarousel = variant === "carousel";
  
  return (
    <div 
      onClick={onClick}
      className={cn(
        "relative rounded-xl border overflow-hidden transition-all group bg-card cursor-pointer",
        isFocused 
          ? "border-purple-500 ring-2 ring-purple-500/30 shadow-lg" 
          : isSelected 
            ? "border-purple-400/50 ring-1 ring-purple-400/20" 
            : "border-border hover:border-purple-400/50",
        isCarousel ? "w-[280px] shrink-0" : "",
        className
      )}
    >
      {/* Blurred Image Section */}
      <div className={cn(
        "relative bg-muted overflow-hidden",
        isCarousel ? "aspect-[4/3]" : "aspect-[3/2]"
      )}>
        {photo ? (
          <img 
            src={photo} 
            alt="Assignment property" 
            className="w-full h-full object-cover filter blur-[8px] scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/20 dark:to-purple-800/10 filter blur-sm" />
        )}
        
        {/* Lock Overlay */}
        <div className="absolute inset-0 bg-background/60 dark:bg-background/70 backdrop-blur-[2px] flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-2">
            <Lock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
            Agent Exclusive
          </span>
        </div>
        
        {/* Assignment Badge */}
        <span className="absolute top-2 left-2 bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide z-10">
          Assignment
        </span>
      </div>
      
      {/* Content Section */}
      <div className={cn(
        "p-3",
        isCarousel ? "p-3" : "p-3"
      )}>
        {/* Blurred Price */}
        <div className="flex items-center gap-2 mb-1">
          <Lock className="h-3.5 w-3.5 text-purple-500" />
          <span className="font-bold text-base text-foreground/70 select-none">
            $XXX,XXX
          </span>
        </div>
        
        {/* Blurred Project Name */}
        <div className="h-4 w-3/4 bg-muted-foreground/20 rounded mb-1.5" />
        
        {/* Blurred Location */}
        <div className="h-3 w-1/2 bg-muted-foreground/15 rounded mb-2" />
        
        {/* Specs (slightly visible to show what's there) */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground/60 mb-3">
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
              *** sqft
            </span>
          )}
        </div>
        
        {/* CTA Button */}
        <Link 
          to="/for-agents"
          onClick={(e) => e.stopPropagation()}
          className="block"
        >
          <button className="w-full py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5">
            <Lock className="h-3 w-3" />
            Login to View Details
          </button>
        </Link>
      </div>
    </div>
  );
}
