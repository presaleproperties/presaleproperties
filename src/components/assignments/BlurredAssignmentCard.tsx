import { forwardRef } from "react";
import { Lock, Bed, Bath, Square, Shield } from "lucide-react";
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
 * Displays a teaser with obscured details and a premium glassmorphism lock overlay.
 * Uses copper/coral color scheme (hsl(18, 85%, 50%)) to match other assignment styling.
 */
export const BlurredAssignmentCard = forwardRef<HTMLDivElement, BlurredAssignmentCardProps>(({
  assignment,
  isFocused = false,
  isSelected = false,
  onClick,
  className,
  variant = "grid",
}, ref) => {
  const photo = assignment.listing_photos?.[0]?.url;
  
  const isCarousel = variant === "carousel";
  
  return (
    <div 
      ref={ref}
      onClick={onClick}
      className={cn(
        "relative rounded-xl border overflow-hidden transition-all duration-300 group bg-card",
        isFocused 
          ? "border-[hsl(18,85%,50%)] ring-2 ring-[hsl(18,85%,50%)]/30 shadow-xl shadow-[hsl(18,85%,50%)]/10" 
          : isSelected 
            ? "border-[hsl(18,85%,50%)]/50 ring-1 ring-[hsl(18,85%,50%)]/20" 
            : "border-border/50 hover:border-[hsl(18,85%,50%)]/50 hover:shadow-lg",
        isCarousel ? "w-[280px] shrink-0" : "",
        className
      )}
    >
      {/* Fully Blurred Image Section - Photo completely obscured for public */}
      <div className={cn(
        "relative bg-muted overflow-hidden",
        isCarousel ? "aspect-[4/3]" : "aspect-[3/2]"
      )}>
        {/* Heavy blur layer - photo is unrecognizable */}
        {photo ? (
          <div className="w-full h-full relative">
            <img 
              src={photo} 
              alt="" 
              className="w-full h-full object-cover blur-[24px] scale-125 saturate-[0.3] opacity-40"
              loading="lazy"
            />
            {/* Color overlay to further obscure */}
            <div className="absolute inset-0 bg-gradient-to-br from-[hsl(18,50%,92%)]/80 to-[hsl(18,40%,88%)]/80 dark:from-[hsl(18,30%,20%)]/90 dark:to-[hsl(18,25%,15%)]/90" />
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[hsl(18,50%,92%)] to-[hsl(18,40%,88%)] dark:from-[hsl(18,30%,20%)] dark:to-[hsl(18,25%,15%)]" />
        )}
        
        {/* Premium Glassmorphism Lock Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/70 to-white/85 dark:from-background/85 dark:via-background/75 dark:to-background/90 backdrop-blur-sm flex flex-col items-center justify-center">
          {/* Glowing lock container */}
          <div className="relative">
            {/* Outer glow ring */}
            <div className="absolute inset-0 w-16 h-16 -m-2 rounded-full bg-[hsl(18,85%,50%)]/25 blur-xl animate-pulse" />
            
            {/* Lock icon container with glassmorphism */}
            <div className="relative w-14 h-14 rounded-full bg-white/90 dark:bg-white/15 backdrop-blur-xl border-2 border-[hsl(18,85%,50%)]/40 shadow-lg flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(18,85%,55%)] to-[hsl(15,80%,45%)] flex items-center justify-center shadow-lg">
                <Lock className="h-5 w-5 text-white drop-shadow-sm" />
              </div>
            </div>
          </div>
          
          {/* Agent Exclusive label with glassmorphism pill */}
          <div className="mt-3 px-4 py-1.5 rounded-full bg-white/80 dark:bg-white/15 backdrop-blur-lg border border-[hsl(18,85%,50%)]/30 shadow-sm">
            <div className="flex items-center gap-1.5">
              <Shield className="h-3 w-3 text-[hsl(18,85%,50%)]" />
              <span className="text-[11px] font-bold text-[hsl(18,85%,40%)] dark:text-[hsl(18,85%,60%)] uppercase tracking-wider">
                Agent Exclusive
              </span>
            </div>
          </div>
        </div>
        
        {/* Assignment Badge */}
        <span className="absolute top-2.5 left-2.5 bg-gradient-to-r from-[hsl(18,85%,50%)] to-[hsl(15,80%,45%)] text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide z-10 shadow-md">
          Assignment
        </span>
      </div>
      
      {/* Content Section with subtle glassmorphism */}
      <div className={cn(
        "p-3.5 bg-gradient-to-b from-card to-card/95",
        isCarousel ? "p-3" : "p-3.5"
      )}>
        {/* Blurred Price with lock */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[hsl(18,85%,50%)]/10">
            <Lock className="h-3 w-3 text-[hsl(18,85%,50%)]" />
            <span className="font-bold text-base text-[hsl(18,85%,40%)]/80 dark:text-[hsl(18,85%,60%)]/80 select-none tracking-tight">
              $XXX,XXX
            </span>
          </div>
        </div>
        
        {/* Blurred Project Name - shimmer placeholder */}
        <div className="h-4 w-3/4 bg-gradient-to-r from-muted-foreground/15 via-muted-foreground/25 to-muted-foreground/15 rounded-md mb-2 animate-pulse" />
        
        {/* Blurred Location */}
        <div className="h-3 w-1/2 bg-muted-foreground/10 rounded mb-3" />
        
        {/* Specs (partially visible to tease) */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground/50 mb-4 pb-3 border-b border-border/50">
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
        
        {/* Premium CTA Button with gradient */}
        <Link 
          to="/for-agents"
          onClick={(e) => e.stopPropagation()}
          className="block"
        >
          <button className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-[hsl(18,85%,50%)] via-[hsl(18,85%,50%)] to-[hsl(15,80%,45%)] hover:from-[hsl(15,80%,45%)] hover:via-[hsl(18,85%,50%)] hover:to-[hsl(18,85%,50%)] text-white text-xs font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:shadow-[hsl(18,85%,50%)]/20 active:scale-[0.98]">
            <Lock className="h-3.5 w-3.5" />
            Login to View Details
          </button>
        </Link>
      </div>
    </div>
  );
});

BlurredAssignmentCard.displayName = "BlurredAssignmentCard";
