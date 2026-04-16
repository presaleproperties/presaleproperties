import { useNavigate } from "react-router-dom";
import { PenTool, Presentation, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type QuickAction = {
  label: string;
  icon: typeof PenTool;
  href: string;
};

const actions: QuickAction[] = [
  { label: "Send Email", icon: PenTool, href: "/dashboard/email-builder" },
  { label: "Share Deck", icon: Presentation, href: "/dashboard/marketing-hub" },
];

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={() => navigate(action.href)}
          className={cn(
            "group inline-flex items-center gap-2 rounded-full border border-border/60 bg-card",
            "px-3.5 py-1.5 text-xs sm:text-sm font-medium text-foreground/80",
            "hover:text-primary hover:border-primary/40 hover:bg-muted/40 transition-all"
          )}
        >
          <action.icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
          <span>{action.label}</span>
          <ArrowUpRight className="h-3 w-3 text-muted-foreground/50 group-hover:text-primary transition-colors" />
        </button>
      ))}
    </div>
  );
}
