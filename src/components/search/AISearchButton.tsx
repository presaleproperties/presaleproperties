import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AISearchPopup } from "./AISearchPopup";
import { cn } from "@/lib/utils";

interface AISearchButtonProps {
  variant?: "default" | "compact" | "hero";
  className?: string;
}

export function AISearchButton({ variant = "default", className }: AISearchButtonProps) {
  const [open, setOpen] = useState(false);

  if (variant === "hero") {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 text-sm font-medium text-primary hover:from-primary/30 hover:to-accent/30 transition-all duration-300 group",
            className
          )}
        >
          <Sparkles className="h-4 w-4 group-hover:animate-pulse" />
          <span>AI Search</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary/80">Beta</span>
        </button>
        <AISearchPopup open={open} onOpenChange={setOpen} />
      </>
    );
  }

  if (variant === "compact") {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          className={cn("relative", className)}
        >
          <Sparkles className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 text-[8px] px-1 rounded bg-primary text-primary-foreground">
            AI
          </span>
        </Button>
        <AISearchPopup open={open} onOpenChange={setOpen} />
      </>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className={cn("gap-2", className)}
      >
        <Sparkles className="h-4 w-4" />
        AI Search
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">Beta</span>
      </Button>
      <AISearchPopup open={open} onOpenChange={setOpen} />
    </>
  );
}
