import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

interface SwipeConfig {
  minSwipeDistance?: number;
  maxSwipeTime?: number;
  edgeThreshold?: number;
}

export function useSwipeNavigation({
  minSwipeDistance = 100,
  maxSwipeTime = 300,
  edgeThreshold = 30,
}: SwipeConfig = {}) {
  const navigate = useNavigate();
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchStartTime = useRef<number>(0);
  const isEdgeSwipe = useRef<boolean>(false);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartX.current = touch.clientX;
      touchStartY.current = touch.clientY;
      touchStartTime.current = Date.now();
      
      // Check if swipe started from left edge (for back navigation)
      isEdgeSwipe.current = touch.clientX <= edgeThreshold;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartX.current;
      const deltaY = touch.clientY - touchStartY.current;
      const deltaTime = Date.now() - touchStartTime.current;

      // Only process horizontal swipes (ignore vertical scrolling)
      const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY) * 1.5;
      const isQuickEnough = deltaTime <= maxSwipeTime;
      const isLongEnough = Math.abs(deltaX) >= minSwipeDistance;

      if (isHorizontalSwipe && isQuickEnough && isLongEnough) {
        if (deltaX > 0 && isEdgeSwipe.current) {
          // Swipe right from edge -> go back
          e.preventDefault();
          navigate(-1);
        } else if (deltaX < 0 && touch.clientX >= window.innerWidth - edgeThreshold) {
          // Swipe left from right edge -> go forward
          e.preventDefault();
          navigate(1);
        }
      }
    };

    // Only enable on touch devices
    if ("ontouchstart" in window) {
      document.addEventListener("touchstart", handleTouchStart, { passive: true });
      document.addEventListener("touchend", handleTouchEnd, { passive: false });
    }

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [navigate, minSwipeDistance, maxSwipeTime, edgeThreshold]);
}
