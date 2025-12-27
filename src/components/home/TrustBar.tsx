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
    <section className="py-4 bg-muted/50 border-b border-border">
      <div className="container">
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
          {trustItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <item.icon className="h-4 w-4 text-primary" />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
