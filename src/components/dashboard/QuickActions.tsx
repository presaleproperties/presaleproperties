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
    label: "Capture Lead",
    description: "Onboard a new client",
    icon: UserPlus,
    accent: "from-primary/90 to-primary",
    ring: "ring-primary/20",
    action: "scroll",
  },
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
    <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={() => handleClick(action)}
          className={cn(
            "group relative overflow-hidden rounded-2xl border border-border/60 bg-card text-left",
            "p-3 sm:p-5 transition-all duration-300",
            "hover:border-primary/40 hover:shadow-[0_10px_40px_-10px_hsl(var(--primary)/0.25)]",
            "hover:-translate-y-0.5"
          )}
        >
          {/* Subtle gold corner glow on hover */}
          <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-primary/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative flex flex-col gap-3 sm:gap-4">
            <div className="flex items-start justify-between">
              <div
                className={cn(
                  "p-2 sm:p-2.5 rounded-xl bg-gradient-to-br text-primary-foreground shadow-sm ring-1",
                  action.accent,
                  action.ring
                )}
              >
                <action.icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors hidden sm:block" />
            </div>

            <div className="space-y-0.5">
              <p className="font-semibold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors leading-tight">
                {action.label}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight hidden sm:block">
                {action.description}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
