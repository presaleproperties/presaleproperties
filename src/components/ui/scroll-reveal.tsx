import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  animation?: "fade-up" | "fade-in" | "slide-left" | "slide-right" | "scale";
  delay?: number;
  duration?: number;
}

export function ScrollReveal({
  children,
  className,
  animation = "fade-up",
  delay = 0,
  duration = 400, // Reduced from 600 for snappier feel
}: ScrollRevealProps) {
  const { ref, isVisible } = useScrollAnimation();

  // Reduced animation intensity to prevent jarring effects
  const animationStyles = {
    "fade-up": {
      initial: "opacity-0 translate-y-4", // Reduced from translate-y-8
      visible: "opacity-100 translate-y-0",
    },
    "fade-in": {
      initial: "opacity-0",
      visible: "opacity-100",
    },
    "slide-left": {
      initial: "opacity-0 translate-x-4", // Reduced from translate-x-8
      visible: "opacity-100 translate-x-0",
    },
    "slide-right": {
      initial: "opacity-0 -translate-x-4", // Reduced from -translate-x-8
      visible: "opacity-100 translate-x-0",
    },
    "scale": {
      initial: "opacity-0 scale-[0.98]", // Reduced from scale-95
      visible: "opacity-100 scale-100",
    },
  };

  const style = animationStyles[animation];

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all ease-out will-change-transform",
        isVisible ? style.visible : style.initial,
        className
      )}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
