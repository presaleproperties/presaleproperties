import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { FloorPlanModal, FloorPlan } from "./FloorPlanModal";
import { LayoutPanelTop, ArrowRight, Square } from "lucide-react";

interface DeckFloorPlansSectionProps {
  floorPlans: FloorPlan[];
}

export function DeckFloorPlansSection({ floorPlans }: DeckFloorPlansSectionProps) {
  const [selected, setSelected] = useState<FloorPlan | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <section id="floor-plans" className="relative py-24 bg-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Watermark */}
        <div className="absolute top-8 right-8 text-[160px] font-black text-foreground/[0.025] select-none pointer-events-none leading-none">
          02
        </div>

        <div className="mb-12 space-y-2">
          <p className="text-primary text-xs font-semibold uppercase tracking-[0.2em]">02 — Floor Plans</p>
          <h2 className="text-4xl font-bold text-foreground">Top Unit Picks</h2>
          <p className="text-muted-foreground text-sm max-w-xl mt-2">
            Click any unit to explore the full floor plan, sizing, and pricing details.
          </p>
        </div>

        {floorPlans.length === 0 ? (
          <div className="py-24 text-center">
            <LayoutPanelTop className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Floor plans coming soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {floorPlans.map((plan, idx) => (
              <button
                key={plan.id}
                className="group relative text-left rounded-2xl overflow-hidden border border-border/50 bg-background hover:border-primary/40 hover:shadow-xl transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onClick={() => setSelected(plan)}
                onMouseEnter={() => setHovered(plan.id)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Image area */}
                <div className="aspect-[4/3] bg-muted overflow-hidden relative">
                  {plan.image_url ? (
                    <>
                      <img
                        src={plan.image_url}
                        alt={plan.unit_type}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {/* Overlay on hover */}
                      <div className={`absolute inset-0 bg-primary/20 flex items-center justify-center transition-opacity duration-300 ${hovered === plan.id ? 'opacity-100' : 'opacity-0'}`}>
                        <div className="flex items-center gap-2 bg-background/90 backdrop-blur-sm text-foreground font-semibold text-sm px-4 py-2 rounded-full shadow-lg">
                          <span>View Floor Plan</span>
                          <ArrowRight className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-muted to-muted/40 gap-3">
                      <LayoutPanelTop className="h-12 w-12 text-muted-foreground/20" />
                      <p className="text-xs text-muted-foreground/50">Plan preview</p>
                    </div>
                  )}

                  {/* Unit type badge */}
                  <div className="absolute top-3 left-3">
                    <span className="bg-background/90 backdrop-blur-sm text-foreground text-[11px] font-bold px-2.5 py-1 rounded-full border border-border/50 shadow-sm">
                      {plan.unit_type}
                    </span>
                  </div>

                  {/* Pick number */}
                  <div className="absolute top-3 right-3">
                    <span className="bg-primary/90 text-primary-foreground text-[10px] font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-sm">
                      {idx + 1}
                    </span>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-4 space-y-3">
                  {/* Price + arrow */}
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Starting from</p>
                      <p className="text-primary font-bold text-lg leading-tight">{plan.price_from}</p>
                    </div>
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${hovered === plan.id ? 'border-primary bg-primary' : 'border-border/50'}`}>
                      <ArrowRight className={`h-3.5 w-3.5 transition-colors ${hovered === plan.id ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                    </div>
                  </div>

                  {/* Size */}
                  {plan.size_range && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Square className="h-3 w-3 shrink-0" />
                      <span>{plan.size_range}</span>
                    </div>
                  )}

                  {/* Price / sqft */}
                  {plan.price_per_sqft && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Square className="h-3 w-3 shrink-0" />
                      <span className="font-medium text-foreground">{plan.price_per_sqft}</span>
                      <span className="text-muted-foreground">/ sqft</span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <FloorPlanModal plan={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
