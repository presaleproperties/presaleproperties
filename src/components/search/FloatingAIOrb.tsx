import { useState } from "react";
import { Sparkles } from "lucide-react";
import { AISearchPopup } from "./AISearchPopup";
import { cn } from "@/lib/utils";

export function FloatingAIOrb() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating Orb Button with "Ask AI" Label */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-6 right-4 z-40",
          "flex items-center gap-2 px-4 py-3 rounded-full",
          "bg-gradient-to-r from-primary to-primary/90",
          "shadow-lg shadow-primary/30",
          "transition-all duration-300 ease-out",
          "hover:scale-105 hover:shadow-xl hover:shadow-primary/40",
          "active:scale-95",
          "animate-glow-pulse"
        )}
        style={{
          boxShadow: "0 0 20px hsl(var(--primary) / 0.3), 0 4px 12px rgba(0,0,0,0.15)"
        }}
        aria-label="Ask AI to find properties"
      >
        <Sparkles className="h-5 w-5 text-primary-foreground" />
        <span className="text-primary-foreground font-semibold text-sm">Ask AI</span>
      </button>

      <AISearchPopup open={open} onOpenChange={setOpen} />
    </>
  );
}
