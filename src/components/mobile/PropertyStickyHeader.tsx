import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Heart, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobileOrTablet } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface SectionTab {
  id: string;
  label: string;
}

interface PropertyStickyHeaderProps {
  price: string;
  specs: string; // e.g., "3 bd • 2 ba • 1,200 sf • Condo"
  tabs?: SectionTab[];
  activeTab?: string;
  onTabClick?: (id: string) => void;
  onShare?: () => void;
  onSave?: () => void;
  backPath?: string;
}

export function PropertyStickyHeader({
  price,
  specs,
  tabs = [],
  activeTab,
  onTabClick,
  onShare,
  onSave,
  backPath = "/presale-projects"
}: PropertyStickyHeaderProps) {
  const navigate = useNavigate();
  const isMobileOrTablet = useIsMobileOrTablet();
  const [isVisible, setIsVisible] = useState(false);
  const [scrollThresholdPassed, setScrollThresholdPassed] = useState(false);
  const lastScrollY = useRef(0);
  const scrollThreshold = 300; // Show after scrolling down 300px

  useEffect(() => {
    if (!isMobileOrTablet) {
      setIsVisible(false);
      return;
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const isScrollingUp = currentScrollY < lastScrollY.current;
      const pastThreshold = currentScrollY > scrollThreshold;

      setScrollThresholdPassed(pastThreshold);
      
      // Show when scrolling up AND past threshold
      // Hide when scrolling down OR before threshold
      if (pastThreshold && isScrollingUp) {
        setIsVisible(true);
      } else if (!isScrollingUp || currentScrollY < 100) {
        setIsVisible(false);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMobileOrTablet]);

  // Don't render on desktop
  if (!isMobileOrTablet) return null;

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-sm transition-transform duration-300 lg:hidden",
        isVisible ? "translate-y-0" : "-translate-y-full"
      )}
    >
      {/* Main Header Row */}
      <div className="flex items-center justify-between px-3 py-2.5 gap-2">
        {/* Back Button + Price/Specs */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-9 w-9"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <div className="font-bold text-lg leading-tight truncate">{price}</div>
            <div className="text-xs text-muted-foreground truncate">{specs}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {onSave && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 text-xs gap-1 rounded-md"
              onClick={onSave}
            >
              <Heart className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Follow</span>
            </Button>
          )}
          {onShare && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 text-xs gap-1 rounded-md"
              onClick={onShare}
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Share</span>
            </Button>
          )}
        </div>
      </div>

      {/* Section Tabs Row */}
      {tabs.length > 0 && (
        <div className="border-t border-border/50">
          <div className="flex overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabClick?.(tab.id)}
                className={cn(
                  "px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors relative shrink-0",
                  activeTab === tab.id
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
