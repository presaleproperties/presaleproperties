import { useNavigate } from "react-router-dom";
import { UserPlus, PenTool, Presentation, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type QuickAction = {
  label: string;
  description: string;
  icon: typeof UserPlus;
  accent: string;
  ring: string;
  action?: "scroll";
  href?: string;
};

const actions: QuickAction[] = [
  {
    label: "Send Email",
    description: "Build a new campaign",
    icon: PenTool,
    accent: "from-foreground to-foreground/80",
    ring: "ring-foreground/10",
    href: "/dashboard/email-builder",
  },
  {
    label: "Share Deck",
    description: "Send a pitch deck",
    icon: Presentation,
    accent: "from-primary-deep to-primary-glow",
    ring: "ring-primary/15",
    href: "/dashboard/marketing-hub",
  },
];

export function QuickActions() {
  const navigate = useNavigate();

  const handleClick = (action: typeof actions[number]) => {
    if (action.action === "scroll") {
      const el = document.getElementById("lead-onboard-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        setTimeout(() => {
          const input = el.querySelector("input");
          if (input) input.focus();
        }, 500);
      }
      return;
    }
    if (action.href) navigate(action.href);
  };

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={() => handleClick(action)}
          className={cn(
            "group flex items-center gap-2.5 rounded-xl border border-border/60 bg-card",
            "px-3 py-2.5 sm:px-4 sm:py-3 text-left transition-all duration-200",
            "hover:border-primary/40 hover:bg-muted/40"
          )}
        >
          <action.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          <span className="text-xs sm:text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
            {action.label}
          </span>
          <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors ml-auto shrink-0" />
        </button>
      ))}
    </div>
  );
}
