import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { FloorPlanModal, FloorPlan } from "./FloorPlanModal";
import { LayoutPanelTop, ArrowRight, Square, TrendingUp } from "lucide-react";

/** Derive $/sqft from price_from string + interior_sqft number */
function derivePsf(plan: FloorPlan): string | null {
  // Use stored value first
  if (plan.price_per_sqft && plan.price_per_sqft.trim()) return plan.price_per_sqft;

  // Try to compute from price_from + interior_sqft
  const price = parseFloat((plan.price_from || "").replace(/[^0-9.]/g, ""));
  const sqft = plan.interior_sqft;

  if (price > 0 && sqft && sqft > 0) {
    const psf = Math.round(price / sqft);
    return `$${psf.toLocaleString()}`;
  }

  // Fallback: try to parse sqft from size_range string (e.g. "540 sq ft" or "540–680 sqft")
  if (price > 0 && plan.size_range) {
    const match = plan.size_range.match(/(\d[\d,]*)/);
    if (match) {
      const parsed = parseInt(match[1].replace(/,/g, ""), 10);
      if (parsed > 100) {
        const psf = Math.round(price / parsed);
        return `$${psf.toLocaleString()}`;
      }
    }
  }

  return null;
}

interface DeckFloorPlansSectionProps {
  floorPlans: FloorPlan[];
  whatsappNumber?: string;
  projectName?: string;
}

export function DeckFloorPlansSection({ floorPlans, whatsappNumber, projectName }: DeckFloorPlansSectionProps) {
  const [selected, setSelected] = useState<FloorPlan | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <section id="floor-plans" className="relative py-16 sm:py-24 bg-muted/20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Watermark — hidden on mobile to prevent overflow */}
        <div className="hidden sm:block absolute top-8 right-8 text-[160px] font-black text-foreground/[0.025] select-none pointer-events-none leading-none">
          02
        </div>

        <div className="mb-8 sm:mb-12 space-y-2">
          <p className="text-primary text-xs font-semibold uppercase tracking-[0.2em]">02 — Hand-Picked For You</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Top Picked Units</h2>
          <p className="text-muted-foreground text-sm max-w-xl mt-1">
            These are the best available units — tap any to see the full layout, size, and price.
          </p>
        </div>

        {floorPlans.length === 0 ? (
          <div className="py-24 text-center">
            <LayoutPanelTop className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Floor plans coming soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
            {floorPlans.map((plan, idx) => (
              <button
                key={plan.id}
                className="group relative text-left rounded-xl sm:rounded-2xl overflow-hidden border border-border/50 bg-background hover:border-primary/40 hover:shadow-xl transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-[0.98] touch-manipulation"
                onClick={() => setSelected(plan)}
                onMouseEnter={() => setHovered(plan.id)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Image area */}
                <div className="aspect-[4/3] bg-muted/40 overflow-hidden relative flex items-center justify-center">
                  {plan.image_url ? (
                    <>
                      <img
                        src={plan.image_url}
                        alt={plan.unit_type}
                        className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 p-2"
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

                  {/* Pick number only on the image */}
                  <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                    <span className="bg-primary/90 text-primary-foreground text-[10px] font-bold w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shadow-sm">
                      {idx + 1}
                    </span>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                  {/* Unit type + price row */}
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0">
                      <p className="text-foreground font-bold text-sm sm:text-base leading-tight truncate">{plan.unit_type}</p>
                      <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">From</p>
                      <p className="text-primary font-bold text-sm sm:text-lg leading-tight truncate">{plan.price_from || "—"}</p>
                    </div>
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300 mt-1 ${hovered === plan.id ? 'border-primary bg-primary' : 'border-border/50'}`}>
                      <ArrowRight className={`h-3 w-3 sm:h-3.5 sm:w-3.5 transition-colors ${hovered === plan.id ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                    </div>
                  </div>

                  {/* Size */}
                  {plan.size_range && (
                    <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
                      <Square className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                      <span className="truncate">{plan.size_range}</span>
                    </div>
                  )}

                  {/* PSF pill */}
                  {(() => {
                    const psf = derivePsf(plan);
                    return psf ? (
                      <div className="flex items-center gap-1 text-[10px] sm:text-xs bg-primary/8 border border-primary/20 text-primary font-semibold px-1.5 sm:px-2 py-0.5 rounded-full w-fit">
                        <TrendingUp className="h-2.5 w-2.5 shrink-0" />
                        <span className="whitespace-nowrap">{psf}/sqft</span>
                      </div>
                    ) : null;
                  })()}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <FloorPlanModal
        plan={selected}
        onClose={() => setSelected(null)}
        whatsappNumber={whatsappNumber}
        projectName={projectName}
      />
    </section>
  );
}
