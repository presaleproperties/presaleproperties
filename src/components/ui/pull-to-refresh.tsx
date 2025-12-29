import { ReactNode } from "react";
import { Loader2, ArrowDown } from "lucide-react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
  threshold?: number;
}

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  threshold?: number;
}

export function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  threshold = 80,
}: PullToRefreshIndicatorProps) {
  const progress = Math.min(pullDistance / threshold, 1);
  const shouldTrigger = pullDistance >= threshold;

  if (pullDistance <= 10 && !isRefreshing) return null;

  return (
    <div
      className="fixed left-0 right-0 flex items-center justify-center z-50 pointer-events-none"
      style={{
        top: 64, // Below header
        height: `${Math.max(pullDistance, isRefreshing ? threshold : 0)}px`,
      }}
    >
      <div
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full bg-background border border-border shadow-lg transition-all duration-200",
          shouldTrigger && !isRefreshing && "bg-primary border-primary",
          isRefreshing && "bg-primary border-primary"
        )}
        style={{
          transform: `rotate(${progress * 180}deg) scale(${0.5 + progress * 0.5})`,
        }}
      >
        {isRefreshing ? (
          <Loader2 className="h-5 w-5 text-primary-foreground animate-spin" />
        ) : (
          <ArrowDown
            className={cn(
              "h-5 w-5 transition-colors duration-200",
              shouldTrigger ? "text-primary-foreground" : "text-muted-foreground"
            )}
          />
        )}
      </div>
    </div>
  );
}

export function PullToRefresh({
  children,
  onRefresh,
  className,
  threshold = 80,
}: PullToRefreshProps) {
  const { pullDistance, isRefreshing, isPulling, containerRef } = usePullToRefresh({
    onRefresh,
    threshold,
  });

  const progress = Math.min(pullDistance / threshold, 1);
  const shouldTrigger = pullDistance >= threshold;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Pull indicator */}
      <div
        className={cn(
          "absolute left-0 right-0 flex items-center justify-center z-50 pointer-events-none transition-opacity duration-200",
          pullDistance > 10 || isRefreshing ? "opacity-100" : "opacity-0"
        )}
        style={{
          top: 0,
          height: `${Math.max(pullDistance, isRefreshing ? threshold : 0)}px`,
        }}
      >
        <div
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full bg-background border border-border shadow-lg transition-all duration-200",
            shouldTrigger && !isRefreshing && "bg-primary border-primary",
            isRefreshing && "bg-primary border-primary"
          )}
          style={{
            transform: `rotate(${progress * 180}deg) scale(${0.5 + progress * 0.5})`,
          }}
        >
          {isRefreshing ? (
            <Loader2 className="h-5 w-5 text-primary-foreground animate-spin" />
          ) : (
            <ArrowDown
              className={cn(
                "h-5 w-5 transition-colors duration-200",
                shouldTrigger ? "text-primary-foreground" : "text-muted-foreground"
              )}
            />
          )}
        </div>
      </div>

      {/* Content with transform */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling ? "none" : "transform 0.3s ease-out",
        }}
      >
        {children}
      </div>
    </div>
  );
}
