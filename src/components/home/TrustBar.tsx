import { ShieldCheck, UserCheck, Building2, MapPin } from "lucide-react";

const trustItems = [
  {
    icon: ShieldCheck,
    label: "Admin-approved listings",
  },
  {
    icon: UserCheck,
    label: "Licensed agent verification",
  },
  {
    icon: Building2,
    label: "Developer-compliant marketing",
  },
  {
    icon: MapPin,
    label: "Vancouver-only inventory",
  },
];

export function TrustBar() {
  return (
    <section className="py-3 sm:py-4 bg-muted/50 border-b border-border">
      <div className="container px-4">
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
          {trustItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 text-[11px] sm:text-xs md:text-sm text-muted-foreground justify-start"
            >
              <item.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
              <span className="leading-tight">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
