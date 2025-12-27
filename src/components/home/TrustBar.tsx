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
    <section className="py-4 bg-muted/50 border-b border-border overflow-hidden">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {trustItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground justify-center md:justify-start"
            >
              <item.icon className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
