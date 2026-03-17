import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FloorPlanModal, FloorPlan } from "./FloorPlanModal";
import { LayoutPanelTop } from "lucide-react";

interface DeckFloorPlansSectionProps {
  floorPlans: FloorPlan[];
}

export function DeckFloorPlansSection({ floorPlans }: DeckFloorPlansSectionProps) {
  const [selected, setSelected] = useState<FloorPlan | null>(null);

  return (
    <section id="floor-plans" className="relative py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Watermark */}
        <div className="absolute top-8 right-8 text-[180px] font-black text-foreground/[0.025] select-none pointer-events-none leading-none">
          02
        </div>

        <div className="mb-12 space-y-2">
          <p className="text-primary text-sm font-semibold uppercase tracking-widest">02 — Floor Plans</p>
          <h2 className="text-4xl font-bold text-foreground">Available Units</h2>
        </div>

        {floorPlans.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            Floor plans coming soon.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {floorPlans.map((plan) => (
              <Card
                key={plan.id}
                className="cursor-pointer hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200 overflow-hidden"
                onClick={() => setSelected(plan)}
              >
                {/* Image / placeholder */}
                <div className="aspect-[4/3] bg-muted overflow-hidden">
                  {plan.image_url ? (
                    <img
                      src={plan.image_url}
                      alt={plan.unit_type}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/60">
                      <LayoutPanelTop className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-foreground text-sm">{plan.unit_type}</h3>
                    <span className="text-primary font-semibold text-sm shrink-0">{plan.price_from}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{plan.size_range}</p>
                  {plan.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {plan.tags.slice(0, 3).map((tag, i) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-0"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <FloorPlanModal plan={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
