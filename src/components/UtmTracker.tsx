import { useEffect } from "react";
import { useUtmTracking } from "@/hooks/useUtmTracking";

/**
 * Component that initializes UTM tracking on app load.
 * This should be placed high in the component tree to capture
 * UTM parameters from the initial landing page.
 */
export function UtmTracker() {
  // Initialize UTM tracking - this will capture params on first render
  useUtmTracking();
  
  return null;
}
