import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { FloorPlanModal, FloorPlan } from "./FloorPlanModal";
import { LayoutPanelTop, ArrowRight, Square, TrendingUp, DollarSign, Car, Archive, Wind, CheckCircle2, Flame, TrendingUp as TrendUp } from "lucide-react";
import { cn } from "@/lib/utils";

function derivePsf(plan: FloorPlan): string | null {
  if (plan.price_per_sqft && plan.price_per_sqft.trim()) return plan.price_per_sqft;
  const price = parseFloat((plan.price_from || "").replace(/[^0-9.]/g, ""));
  const sqft = plan.interior_sqft;
  if (price > 0 && sqft && sqft > 0) return `$${Math.round(price / sqft).toLocaleString()}`;
  if (price > 0 && plan.size_range) {
    const match = plan.size_range.match(/(\d[\d,]*)/);
    if (match) {
      const parsed = parseInt(match[1].replace(/,/g, ""), 10);
      if (parsed > 100) return `$${Math.round(price / parsed).toLocaleString()}`;
    }
  }
  return null;
}

const INCLUDED_ICONS: Record<string, React.ReactNode> = {
  parking: <Car className="h-3.5 w-3.5 shrink-0" />,
  storage: <Archive className="h-3.5 w-3.5 shrink-0" />,
  locker: <Archive className="h-3.5 w-3.5 shrink-0" />,
  ac: <Wind className="h-3.5 w-3.5 shrink-0" />,
  "air conditioning": <Wind className="h-3.5 w-3.5 shrink-0" />,
};
function getIncludedIcon(item: string) {
  return INCLUDED_ICONS[item.toLowerCase()] || <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />;
}

// Expand items with counts: "2 Parking" → "2 Parking Stalls"
function formatIncludedItem(item: string): string {
  const lower = item.toLowerCase();
  if (/^\d+\s+park/.test(lower)) return item; // already has number
  if (/^\d+\s+stor/.test(lower)) return item;
  return item;
}

interface DeckFloorPlansSectionProps {
  floorPlans: FloorPlan[];
  whatsappNumber?: string;
  projectName?: string;
  assignmentFee?: string | null;
  includedItems?: string[] | null;
  unitsRemaining?: number | null;
  nextPriceIncrease?: string | null;
}

export function DeckFloorPlansSection({
  floorPlans,
  whatsappNumber,
  projectName,
  assignmentFee,
  includedItems,
  unitsRemaining,
  nextPriceIncrease,
}: DeckFloorPlansSectionProps) {
  const [selected, setSelected] = useState<FloorPlan | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const displayItems = (includedItems && includedItems.length > 0)
    ? includedItems
    : ["Parking", "Storage", "AC"];

  const hasScarcity = (unitsRemaining !== null && unitsRemaining !== undefined) || nextPriceIncrease;

  return (
    <section id="floor-plans" className="relative py-16 sm:py-24 bg-muted/20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">

        <div className="mb-8 sm:mb-12 space-y-5">
          <div className="space-y-2">
            <p className="text-primary text-xs font-semibold uppercase tracking-[0.2em]">02 — Hand-Picked For You</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Top Picked Units</h2>
            <p className="text-muted-foreground text-sm max-w-xl">
              These are the best available units — tap any to see the full layout, size, and price.
            </p>
          </div>

          {/* Key facts row */}
          <div className="flex flex-wrap items-stretch gap-3">
            {/* Included in price */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-background border border-border/60 shadow-sm">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 shrink-0">
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold leading-none mb-1.5">Included in Price</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {displayItems.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20"
                    >
                      {getIncludedIcon(item)}
                      {formatIncludedItem(item)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Scarcity / urgency — inline here next to the units */}
          {hasScarcity && (
            <div className="flex flex-wrap items-center gap-3">
              {unitsRemaining !== null && unitsRemaining !== undefined && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-destructive/8 border border-destructive/25">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-60" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
                  </span>
                  <Flame className="h-3.5 w-3.5 text-destructive shrink-0" />
                  <p className="text-sm font-semibold text-destructive">
                    {unitsRemaining === 1 ? "Only 1 unit remaining at this price" : `Only ${unitsRemaining} units remaining at this price`}
                  </p>
                </div>
              )}
              {nextPriceIncrease && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/8 border border-primary/25">
                  <TrendUp className="h-3.5 w-3.5 text-primary shrink-0" />
                  <p className="text-sm font-semibold text-primary">Next price increase: {nextPriceIncrease} more</p>
                </div>
              )}
            </div>
          )}
        </div>

        {floorPlans.length === 0 ? (
          <div className="py-24 text-center">
            <LayoutPanelTop className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Floor plans coming soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {floorPlans.map((plan, idx) => (
              <button
                key={plan.id}
                className="group relative text-left rounded-2xl overflow-hidden border border-border/60 bg-background hover:border-primary/60 hover:shadow-xl transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-[0.98] touch-manipulation"
                onClick={() => setSelected(plan)}
                onMouseEnter={() => setHovered(plan.id)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Image */}
                <div className="aspect-[4/3] bg-muted/40 overflow-hidden relative flex items-center justify-center">
                  {plan.image_url ? (
                    <>
                      <img
                        src={plan.image_url}
                        alt={plan.unit_type}
                        className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 p-2"
                      />
                      <div className={cn("absolute inset-0 bg-primary/15 flex items-center justify-center transition-opacity duration-300", hovered === plan.id ? "opacity-100" : "opacity-0")}>
                        <div className="flex items-center gap-2 bg-background/90 backdrop-blur-sm text-foreground font-semibold text-sm px-4 py-2 rounded-full shadow-lg">
                          <span>View Floor Plan</span>
                          <ArrowRight className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-muted to-muted/40 gap-3">
                      <LayoutPanelTop className="h-10 w-10 text-muted-foreground/20" />
                    </div>
                  )}
                  <div className="absolute top-2.5 right-2.5">
                    <span className="bg-primary text-primary-foreground text-[10px] font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-sm">
                      {idx + 1}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-3.5 sm:p-4 space-y-2">
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0">
                      <p className="text-foreground font-bold text-sm sm:text-base leading-tight">{plan.unit_type}</p>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">Starting from</p>
                      <p className="text-primary font-bold text-base sm:text-lg leading-tight">{plan.price_from || "—"}</p>
                    </div>
                    <div className={cn("w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300 mt-1", hovered === plan.id ? "border-primary bg-primary" : "border-border/50")}>
                      <ArrowRight className={cn("h-3.5 w-3.5 transition-colors", hovered === plan.id ? "text-primary-foreground" : "text-muted-foreground")} />
                    </div>
                  </div>

                  {plan.size_range && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Square className="h-3 w-3 shrink-0" />
                      <span>{plan.size_range}</span>
                    </div>
                  )}

                  {(() => {
                    const psf = derivePsf(plan);
                    return psf ? (
                      <div className="flex items-center gap-1 text-[11px] bg-primary/8 border border-primary/20 text-primary font-semibold px-2 py-0.5 rounded-full w-fit">
                        <TrendingUp className="h-2.5 w-2.5 shrink-0" />
                        {psf}/sqft
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
