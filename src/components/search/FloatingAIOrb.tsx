import { useState } from "react";
import { Sparkles } from "lucide-react";
import { AIChatDrawer } from "./AIChatDrawer";
import { cn } from "@/lib/utils";

export function FloatingAIOrb() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating AI Orb Button */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-6 right-4 z-40",
          "w-14 h-14 rounded-full",
          "flex items-center justify-center",
          "bg-gradient-to-br from-primary via-primary to-primary/80",
          "shadow-lg shadow-primary/25",
          "transition-all duration-300 ease-out",
          "hover:scale-110 hover:shadow-xl hover:shadow-primary/35",
          "active:scale-95"
        )}
        style={{
          boxShadow: "0 0 25px hsl(var(--primary) / 0.3), 0 4px 15px rgba(0,0,0,0.15)"
        }}
        aria-label="Chat with AI to find properties"
      >
        <Sparkles className="h-6 w-6 text-primary-foreground" />
      </button>

      <AIChatDrawer open={open} onOpenChange={setOpen} />
    </>
  );
}
