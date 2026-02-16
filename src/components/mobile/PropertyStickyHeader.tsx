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

  // Don't render on desktop
  if (!isMobileOrTablet) return null;

  return (
    <div className="sticky top-0 z-50 bg-background/98 backdrop-blur-lg border-b border-border shadow-sm lg:hidden" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      {/* Main Header Row */}
      <div className="flex items-center justify-between px-3 py-2.5 gap-2">
        {/* Back Button + Price/Specs */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-10 w-10 min-h-[44px] min-w-[44px]"
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
        <div className="flex items-center gap-1.5 shrink-0">
          {onSave && (
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 min-h-[44px] min-w-[44px] p-0 rounded-lg"
              onClick={onSave}
            >
              <Heart className="h-4 w-4" />
              <span className="sr-only">Save</span>
            </Button>
          )}
          {onShare && (
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 min-h-[44px] min-w-[44px] p-0 rounded-lg"
              onClick={onShare}
            >
              <Share2 className="h-4 w-4" />
              <span className="sr-only">Share</span>
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
