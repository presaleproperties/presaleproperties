import { useState } from "react";
import { AIChatDrawer } from "./AIChatDrawer";
import { cn } from "@/lib/utils";
import zaraHeadshot from "@/assets/zara-headshot.png";

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
          "overflow-hidden",
          "shadow-lg shadow-primary/25",
          "transition-all duration-300 ease-out",
          "hover:scale-110 hover:shadow-xl hover:shadow-primary/35",
          "active:scale-95",
          "ring-2 ring-primary ring-offset-2"
        )}
        style={{
          boxShadow: "0 0 25px hsl(var(--primary) / 0.3), 0 4px 15px rgba(0,0,0,0.15)"
        }}
        aria-label="Chat with Zara AI to find properties"
      >
        <img src={zaraHeadshot} alt="Zara AI" className="w-full h-full object-cover" />
      </button>

      <AIChatDrawer open={open} onOpenChange={setOpen} />
    </>
  );
}
