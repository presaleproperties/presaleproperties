import { useState, useEffect, useCallback } from "react";

interface UseScrollHeaderOptions {
  /** Threshold in pixels before scroll behavior activates */
  threshold?: number;
  /** Sensitivity - how much scroll is needed to trigger hide/show (higher = less sensitive) */
  sensitivity?: number;
}

/**
 * Hook to manage header visibility based on scroll direction
 * Shows header on scroll up, hides on scroll down
 * Returns isVisible boolean for controlling header visibility
 */
export function useScrollHeader(options: UseScrollHeaderOptions = {}) {
  const { threshold = 100, sensitivity = 10 } = options;
  
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [hasScrolledPastThreshold, setHasScrolledPastThreshold] = useState(false);

  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    
    // Check if we've scrolled past the threshold
    if (currentScrollY > threshold) {
      setHasScrolledPastThreshold(true);
    } else {
      setHasScrolledPastThreshold(false);
      setIsVisible(true);
      setLastScrollY(currentScrollY);
      return;
    }

    // Only apply scroll direction logic after threshold
    if (hasScrolledPastThreshold) {
      const scrollDiff = currentScrollY - lastScrollY;
      
      // Scrolling down - hide header (with sensitivity check)
      if (scrollDiff > sensitivity) {
        setIsVisible(false);
        setLastScrollY(currentScrollY);
      }
      // Scrolling up - show header (with sensitivity check)
      else if (scrollDiff < -sensitivity) {
        setIsVisible(true);
        setLastScrollY(currentScrollY);
      }
    }
  }, [lastScrollY, hasScrolledPastThreshold, threshold, sensitivity]);

  useEffect(() => {
    // Use passive listener for better scroll performance
    window.addEventListener("scroll", handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  return { isVisible, hasScrolledPastThreshold };
}
