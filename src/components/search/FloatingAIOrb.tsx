import { useState } from "react";
import { Sparkles } from "lucide-react";
import { AISearchPopup } from "./AISearchPopup";
import { cn } from "@/lib/utils";

export function FloatingAIOrb() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating Orb Button with Label */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-center gap-2">
        
        {/* Orb Button */}
        <button
          onClick={() => setOpen(true)}
          className={cn(
            "w-14 h-14 rounded-full",
            "bg-gradient-to-br from-primary via-primary to-primary/80",
            "shadow-lg shadow-primary/30",
            "flex items-center justify-center",
            "transition-all duration-300 ease-out",
            "hover:scale-110 hover:shadow-xl hover:shadow-primary/50",
            "active:scale-95",
            "animate-glow-pulse"
          )}
          style={{
            boxShadow: "0 0 20px hsl(var(--primary) / 0.4), 0 0 40px hsl(var(--primary) / 0.2), 0 4px 12px rgba(0,0,0,0.15)"
          }}
          aria-label="AI Search"
        >
          <Sparkles className="h-6 w-6 text-primary-foreground relative z-10" />
        </button>
      </div>

      <AISearchPopup open={open} onOpenChange={setOpen} />
    </>
  );
}
