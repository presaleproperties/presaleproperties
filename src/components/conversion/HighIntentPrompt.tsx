/**
 * High Intent Prompt
 * Subtle inline message shown to high-intent visitors
 * (2+ views of same project or favorited)
 */

import { useState, useEffect } from "react";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendEvent } from "@/lib/tracking/events";

interface HighIntentPromptProps {
  projectId: string;
  projectName: string;
  viewCount: number;
  isFavorited: boolean;
  onGetPricing: () => void;
}

export function HighIntentPrompt({
  projectId,
  projectName,
  viewCount,
  isFavorited,
  onGetPricing,
}: HighIntentPromptProps) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Show prompt only for high-intent users
  useEffect(() => {
    const dismissedKey = `pp_hip_dismissed_${projectId}`;
    const wasDismissed = sessionStorage.getItem(dismissedKey) === "true";
    
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    // Show if: 2+ views OR favorited
    if (viewCount >= 2 || isFavorited) {
      // Delay appearance slightly for better UX
      const timer = setTimeout(() => {
        setVisible(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [projectId, viewCount, isFavorited]);

  const handleDismiss = () => {
    sessionStorage.setItem(`pp_hip_dismissed_${projectId}`, "true");
    setDismissed(true);
    setVisible(false);
  };

  const handleGetPricing = () => {
    // Track high intent event
    sendEvent("high_intent_project", {
      project_id: projectId,
      project_name: projectName,
      trigger: isFavorited ? "favorited" : `view_count_${viewCount}`,
    });

    onGetPricing();
  };

  if (dismissed || !visible) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-warning-soft to-warning-soft dark:from-warning-strong/30 dark:to-warning-strong/30 border border-warning/30/50 dark:border-warning/50 rounded-xl p-4 my-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-start gap-3">
        <div className="shrink-0 p-2 bg-warning-soft dark:bg-warning-strong/50 rounded-lg">
          <Sparkles className="h-4 w-4 text-warning dark:text-warning" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-warning-strong dark:text-warning-soft-foreground">
            Want pricing, incentives, and best unit types for this project?
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Button
              onClick={handleGetPricing}
              size="sm"
              variant="default"
              className="h-8 text-xs font-medium"
            >
              Get Pricing Now
            </Button>
            <button
              onClick={handleDismiss}
              className="text-xs text-warning dark:text-warning hover:underline"
            >
              Maybe later
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="shrink-0 p-1 text-warning hover:text-warning transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
