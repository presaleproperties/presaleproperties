import { useState } from "react";
import { Sparkles } from "lucide-react";
import { AIChatDrawer } from "./AIChatDrawer";
import { cn } from "@/lib/utils";

export function FloatingAIOrb() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating Chat Button with "Ask AI" Label */}
      <div className="fixed bottom-6 right-4 z-40">
        {/* Pulsing ring animation behind the button */}
        <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" style={{ animationDuration: '2.5s' }} />
        <div className="absolute -inset-1 rounded-full bg-primary/15 animate-pulse" />
        
        {/* "New" badge */}
        <div className="absolute -top-2 -right-1 z-10">
          <span className="relative flex h-5 w-auto">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex items-center rounded-full h-5 px-2 bg-green-500 text-[10px] font-bold text-white uppercase tracking-wide">
              New
            </span>
          </span>
        </div>
        
        <button
          onClick={() => setOpen(true)}
          className={cn(
            "relative flex items-center gap-2.5 px-5 py-3.5 rounded-full",
            "bg-gradient-to-r from-primary to-primary/90",
            "shadow-lg shadow-primary/25",
            "transition-all duration-300 ease-out",
            "hover:scale-105 hover:shadow-xl hover:shadow-primary/35",
            "active:scale-95"
          )}
          style={{
            boxShadow: "0 0 25px hsl(var(--primary) / 0.25), 0 4px 15px rgba(0,0,0,0.12)"
          }}
          aria-label="Chat with AI to find properties"
        >
          <Sparkles className="h-5 w-5 text-primary-foreground" />
          <span className="text-primary-foreground font-semibold text-sm">Ask AI</span>
        </button>
      </div>

      <AIChatDrawer open={open} onOpenChange={setOpen} />
    </>
  );
}
