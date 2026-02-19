import { useRef, useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

type SheetState = "collapsed" | "half" | "full";

interface MobileBottomSheetProps {
  count: number;
  children: React.ReactNode;
  className?: string;
}

const SHEET_HEIGHTS: Record<SheetState, string> = {
  collapsed: "72px",
  half: "50vh",
  full: "85vh",
};

const STATES_ORDER: SheetState[] = ["collapsed", "half", "full"];

export function MobileBottomSheet({ count, children, className }: MobileBottomSheetProps) {
  const [state, setState] = useState<SheetState>("collapsed");
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);
  const isDragging = useRef(false);

  // Cycle through states on handle tap
  const cycleState = useCallback(() => {
    const idx = STATES_ORDER.indexOf(state);
    const next = STATES_ORDER[(idx + 1) % STATES_ORDER.length];
    setState(next);
  }, [state]);

  // Drag handling
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    dragStartY.current = touch.clientY;
    dragStartHeight.current = sheetRef.current?.offsetHeight || 0;
    isDragging.current = false;
    e.stopPropagation();
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const delta = dragStartY.current - touch.clientY;
    if (Math.abs(delta) > 10) isDragging.current = true;
    e.stopPropagation();
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    const delta = dragStartY.current - touch.clientY;
    e.stopPropagation();

    if (!isDragging.current) {
      // Tap - cycle states
      cycleState();
      return;
    }

    // Swipe up = expand, swipe down = collapse
    if (delta > 50) {
      // Swipe up
      if (state === "collapsed") setState("half");
      else if (state === "half") setState("full");
    } else if (delta < -50) {
      // Swipe down
      if (state === "full") setState("half");
      else if (state === "half") setState("collapsed");
    }
  }, [state, cycleState]);

  return (
    <div
      ref={sheetRef}
      className={cn(
        "absolute bottom-0 left-0 right-0 z-[1001] lg:hidden bg-background/95 backdrop-blur-xl rounded-t-2xl shadow-[0_-4px_30px_rgba(0,0,0,0.15)] border-t border-border/30",
        className
      )}
      style={{
        height: SHEET_HEIGHTS[state],
        transition: "height 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Drag Handle */}
      <div
        className="flex flex-col items-center justify-center pt-2 pb-2 cursor-grab active:cursor-grabbing touch-manipulation select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="w-10 h-1 rounded-full bg-foreground/20 mb-1.5" />
        <div className="flex items-center justify-between w-full px-4">
          <span className="text-sm font-semibold text-foreground">
            {count} {count === 1 ? "Property" : "Properties"}
          </span>
          {state !== "collapsed" && (
            <button
              onClick={(e) => { e.stopPropagation(); setState("collapsed"); }}
              className="p-1 rounded-lg hover:bg-muted transition-colors"
              aria-label="Collapse"
            >
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {state !== "collapsed" && (
        <div
          className="flex-1 overflow-y-auto px-3 pb-3"
          style={{
            height: `calc(${SHEET_HEIGHTS[state]} - 56px - env(safe-area-inset-bottom, 0px))`,
            scrollbarWidth: "thin",
            scrollbarColor: "hsl(var(--muted-foreground) / 0.3) transparent",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
