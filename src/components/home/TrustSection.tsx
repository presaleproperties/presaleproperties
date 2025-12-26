import { Shield, UserCheck, BadgeCheck, Clock } from "lucide-react";

const features = [
  {
    icon: UserCheck,
    title: "Verified Agents",
    description: "Every agent's real estate license is verified by our team before they can list.",
  },
  {
    icon: Shield,
    title: "Admin Approved",
    description: "All listings are reviewed and approved by our team to ensure quality and accuracy.",
  },
  {
    icon: BadgeCheck,
    title: "Trusted Marketplace",
    description: "Connect directly with licensed professionals. Agent contact info displayed on every listing.",
  },
  {
    icon: Clock,
    title: "Real-Time Updates",
    description: "Get the latest assignments as soon as they're listed. No stale data.",
  },
];

export function TrustSection() {
  return (
    <section className="py-16 bg-background">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Why Choose AssignmentHub
          </h2>
          <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
            Vancouver's most trusted platform for presale condo assignments
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="text-center p-6 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}