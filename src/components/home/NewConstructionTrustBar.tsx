import { Home, ShieldCheck, BadgeCheck, Sparkles } from "lucide-react";

const trustItems = [
  {
    icon: Sparkles,
    label: "Never Lived In",
  },
  {
    icon: ShieldCheck,
    label: "Full Warranty",
  },
  {
    icon: BadgeCheck,
    label: "Rebate Eligible",
  },
  {
    icon: Home,
    label: "New Construction Only",
  },
];

export function NewConstructionTrustBar() {
  return (
    <section className="py-4 sm:py-5 bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30 border-b border-border">
      <div className="container px-4">
        <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-8 md:gap-12">
          {trustItems.map((item, index) => (
            <div
              key={item.label}
              className="flex items-center gap-2.5 text-[11px] sm:text-xs md:text-sm text-foreground/80 group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                <item.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
              </div>
              <span className="leading-tight whitespace-nowrap font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
