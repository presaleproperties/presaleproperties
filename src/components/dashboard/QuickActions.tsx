import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PenTool, Presentation, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuickSendDialog } from "./QuickSendDialog";

export function QuickActions() {
  const navigate = useNavigate();
  const [sendOpen, setSendOpen] = useState(false);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSendOpen(true)}
          className={cn(
            "group inline-flex items-center gap-2 rounded-full border border-border/60 bg-card",
            "px-3.5 py-1.5 text-xs sm:text-sm font-medium text-foreground/80",
            "hover:text-primary hover:border-primary/40 hover:bg-muted/40 transition-all"
          )}
        >
          <PenTool className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
          <span>Send Email</span>
          <ArrowUpRight className="h-3 w-3 text-muted-foreground/50 group-hover:text-primary transition-colors" />
        </button>

        <button
          onClick={() => navigate("/dashboard/marketing-hub")}
          className={cn(
            "group inline-flex items-center gap-2 rounded-full border border-border/60 bg-card",
            "px-3.5 py-1.5 text-xs sm:text-sm font-medium text-foreground/80",
            "hover:text-primary hover:border-primary/40 hover:bg-muted/40 transition-all"
          )}
        >
          <Presentation className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
          <span>Share Deck</span>
          <ArrowUpRight className="h-3 w-3 text-muted-foreground/50 group-hover:text-primary transition-colors" />
        </button>
      </div>

      <QuickSendDialog open={sendOpen} onOpenChange={setSendOpen} />
    </>
  );
}
