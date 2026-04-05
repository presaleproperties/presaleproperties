import { useCallback, useRef, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Loader2, ArrowDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Global pull-to-refresh: works on every page, mobile only.
 * Attaches touch listeners to `window` so it works regardless of page content.
 */
export function GlobalPullToRefresh({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const isPulling = useRef(false);
  const startY = useRef(0);

  const threshold = 80;
  const maxPull = 130;
  const resistance = 0.4;

  // Reset on route change
  useEffect(() => {
    setPullDistance(0);
    setIsRefreshing(false);
    setShowSuccess(false);
    isPulling.current = false;
  }, [location.pathname]);

  const isDashboard = location.pathname.startsWith("/dashboard");

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (isDashboard || window.scrollY > 0 || isRefreshing) return;
    startY.current = e.touches[0].clientY;
    isPulling.current = true;
  }, [isRefreshing, isDashboard]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling.current || isRefreshing) return;
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 0 && window.scrollY === 0) {
      const distance = Math.min(diff * resistance, maxPull);
      setPullDistance(distance);
      if (distance > 5) e.preventDefault();
    } else {
      setPullDistance(0);
    }
  }, [isRefreshing]);

  const handleTouchEnd = useCallback(() => {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold);
      // Reload the page after a brief visual delay
      setTimeout(() => {
        window.location.reload();
      }, 400);
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, isRefreshing, threshold]);

  useEffect(() => {
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const progress = Math.min(pullDistance / threshold, 1);
  const shouldTrigger = pullDistance >= threshold;
  const shouldShow = pullDistance > 8 || isRefreshing;

  return (
    <>
      {/* Pull indicator */}
      {shouldShow && (
        <div
          className="fixed left-0 right-0 flex flex-col items-center justify-center z-[9999] pointer-events-none"
          style={{
            top: 0,
            height: `${isRefreshing ? threshold : Math.max(pullDistance, 0)}px`,
            transition: isPulling.current ? "none" : "height 0.3s ease-out",
          }}
        >
          <div
            className={cn(
              "flex items-center justify-center w-9 h-9 rounded-full shadow-lg transition-all duration-200",
              shouldTrigger || isRefreshing
                ? "bg-primary border-primary"
                : "bg-background border border-border"
            )}
            style={{
              transform: !isRefreshing
                ? `rotate(${progress * 180}deg) scale(${0.5 + progress * 0.5})`
                : undefined,
            }}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 text-primary-foreground animate-spin" />
            ) : (
              <ArrowDown
                className={cn(
                  "h-4 w-4 transition-colors duration-200",
                  shouldTrigger ? "text-primary-foreground" : "text-muted-foreground"
                )}
              />
            )}
          </div>
          <span
            className={cn(
              "mt-1 text-[11px] font-medium transition-all duration-200",
              shouldTrigger || isRefreshing ? "text-primary" : "text-muted-foreground"
            )}
            style={{ opacity: progress > 0.3 || isRefreshing ? 1 : 0 }}
          >
            {isRefreshing ? "Refreshing…" : shouldTrigger ? "Release to refresh" : "Pull to refresh"}
          </span>
        </div>
      )}
      {children}
    </>
  );
}
