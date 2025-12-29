import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";

export function SwipeNavigationProvider({ children }: { children: React.ReactNode }) {
  useSwipeNavigation({
    minSwipeDistance: 80,
    maxSwipeTime: 400,
    edgeThreshold: 40,
  });

  return <>{children}</>;
}
