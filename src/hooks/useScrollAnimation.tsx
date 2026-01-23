import { useEffect, useRef, useState, useLayoutEffect } from "react";

interface UseScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useScrollAnimation({
  threshold = 0.1,
  rootMargin = "0px 0px -50px 0px",
  triggerOnce = true,
}: UseScrollAnimationOptions = {}) {
  const ref = useRef<HTMLDivElement>(null);
  // Start visible to prevent flash on navigation - will be set to false only if below fold
  const [isVisible, setIsVisible] = useState(true);
  const hasCheckedInitial = useRef(false);

  // Check immediately on mount if element is in viewport (above fold)
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || hasCheckedInitial.current) return;
    
    hasCheckedInitial.current = true;
    
    const rect = element.getBoundingClientRect();
    const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
    
    // Only hide if below the fold - prevents flash for above-fold content
    if (!isInViewport) {
      setIsVisible(false);
    }
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce]);

  return { ref, isVisible };
}
