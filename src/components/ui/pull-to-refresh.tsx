import { ReactNode, useState, useEffect } from "react";
import { Loader2, ArrowDown, Check } from "lucide-react";
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
  const [showSuccess, setShowSuccess] = useState(false);
  const [wasRefreshing, setWasRefreshing] = useState(false);
  
  const progress = Math.min(pullDistance / threshold, 1);
  const shouldTrigger = pullDistance >= threshold;

  // Track when refresh completes to show success state
  useEffect(() => {
    if (isRefreshing) {
      setWasRefreshing(true);
      setShowSuccess(false);
    } else if (wasRefreshing && !isRefreshing) {
      setShowSuccess(true);
      setWasRefreshing(false);
      const timer = setTimeout(() => setShowSuccess(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [isRefreshing, wasRefreshing]);

  // Hide indicator completely when not in use
  const shouldShow = pullDistance > 10 || isRefreshing || showSuccess;
  
  if (!shouldShow) return null;

  const getMessage = () => {
    if (showSuccess) return "Updated!";
    if (isRefreshing) return "Refreshing...";
    if (shouldTrigger) return "Release to refresh";
    return "Pull to refresh";
  };

  // Calculate height - collapse after showing success
  const indicatorHeight = showSuccess 
    ? 60 
    : isRefreshing 
      ? threshold 
      : Math.max(pullDistance, 0);

  return (
    <div
      className="fixed left-0 right-0 flex flex-col items-center justify-center z-50 pointer-events-none"
      style={{
        top: 48,
        height: `${indicatorHeight}px`,
        opacity: shouldShow ? 1 : 0,
        transition: 'height 0.3s ease-out, opacity 0.3s ease-out',
      }}
    >
      {/* Animated indicator circle */}
      <div
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full shadow-lg transition-all duration-300",
          showSuccess 
            ? "bg-green-500 border-green-500 scale-110" 
            : shouldTrigger || isRefreshing 
              ? "bg-primary border-primary" 
              : "bg-background border border-border"
        )}
        style={{
          transform: !showSuccess && !isRefreshing 
            ? `rotate(${progress * 180}deg) scale(${0.5 + progress * 0.5})` 
            : undefined,
        }}
      >
        {showSuccess ? (
          <Check className="h-5 w-5 text-white animate-scale-in" />
        ) : isRefreshing ? (
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
      
      {/* Status text */}
      <span 
        className={cn(
          "mt-1.5 text-xs font-medium transition-all duration-200",
          showSuccess 
            ? "text-green-600" 
            : shouldTrigger || isRefreshing 
              ? "text-primary" 
              : "text-muted-foreground"
        )}
        style={{
          opacity: progress > 0.3 || isRefreshing || showSuccess ? 1 : 0,
          transform: `translateY(${progress > 0.3 || isRefreshing || showSuccess ? 0 : -10}px)`,
        }}
      >
        {getMessage()}
      </span>
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
