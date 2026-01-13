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
    <section className="py-3 sm:py-4 bg-muted/50 border-b border-border">
      <div className="container px-4">
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-8">
          {trustItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 text-[11px] sm:text-xs md:text-sm text-muted-foreground"
            >
              <item.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
              <span className="leading-tight whitespace-nowrap">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
