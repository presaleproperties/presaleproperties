import { useState } from "react";
import { Sparkles } from "lucide-react";
import { AISearchPopup } from "./AISearchPopup";
import { cn } from "@/lib/utils";

export function FloatingAIOrb() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating Orb Button */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-40",
          "w-14 h-14 rounded-full",
          "bg-gradient-to-br from-primary via-primary to-primary/80",
          "shadow-lg shadow-primary/30",
          "flex items-center justify-center",
          "transition-all duration-300 ease-out",
          "hover:scale-110 hover:shadow-xl hover:shadow-primary/40",
          "active:scale-95",
          // Pulsing animation
          "before:absolute before:inset-0 before:rounded-full before:bg-primary/40 before:animate-ping before:opacity-75",
          // Glow effect
          "after:absolute after:inset-[-4px] after:rounded-full after:bg-gradient-to-br after:from-primary/30 after:to-transparent after:blur-md after:-z-10"
        )}
        aria-label="AI Search"
      >
        <Sparkles className="h-6 w-6 text-primary-foreground relative z-10" />
      </button>

      <AISearchPopup open={open} onOpenChange={setOpen} />
    </>
  );
}
