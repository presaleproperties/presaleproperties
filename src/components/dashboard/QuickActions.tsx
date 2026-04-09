import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, PenTool, Presentation } from "lucide-react";
import { cn } from "@/lib/utils";

const actions = [
  {
    label: "Capture Lead",
    description: "Onboard a new client",
    icon: UserPlus,
    color: "from-blue-500 to-blue-600",
    action: "scroll", // will scroll to LeadOnboardHub
  },
  {
    label: "Send Email",
    description: "Build a new campaign",
    icon: PenTool,
    color: "from-violet-500 to-violet-600",
    href: "/dashboard/email-builder",
  },
  {
    label: "Share Deck",
    description: "Send a pitch deck",
    icon: Presentation,
    color: "from-amber-500 to-amber-600",
    href: "/dashboard/decks",
  },
];

export function QuickActions() {
  const navigate = useNavigate();

  const handleClick = (action: typeof actions[number]) => {
    if (action.action === "scroll") {
      // Scroll to lead onboard section
      const el = document.getElementById("lead-onboard-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        // Focus the first input after scroll
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
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {actions.map((action) => (
        <Card
          key={action.label}
          className="group cursor-pointer border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-200"
          onClick={() => handleClick(action)}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className={cn("p-2.5 rounded-xl bg-gradient-to-br text-white shrink-0", action.color)}>
              <action.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm group-hover:text-primary transition-colors">{action.label}</p>
              <p className="text-xs text-muted-foreground">{action.description}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
