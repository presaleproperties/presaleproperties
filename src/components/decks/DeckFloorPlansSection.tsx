import { useState } from "react";
import { FloorPlanModal, FloorPlan } from "./FloorPlanModal";
import { LayoutPanelTop, ArrowRight, Square, TrendingUp, Car, Archive, Wind, CheckCircle2, Flame, TrendingUp as TrendUp, BedDouble, Bath } from "lucide-react";
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
  const lower = item.toLowerCase();
  for (const [key, icon] of Object.entries(INCLUDED_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />;
}

function normalizeIncludedItem(item: string): string {
  const lower = item.toLowerCase().trim();
  if (/^\d/.test(lower)) return item;
  if (lower === "parking" || lower === "parking stall") return "1 Parking Stall";
  if (lower === "storage" || lower === "storage locker" || lower === "locker") return "1 Storage Locker";
  if (lower === "ac" || lower === "air conditioning" || lower === "a/c") return "Air Conditioning";
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
  incentives?: string[] | null;
}

export function DeckFloorPlansSection({
  floorPlans,
  whatsappNumber,
  projectName,
  includedItems,
  unitsRemaining,
  nextPriceIncrease,
}: DeckFloorPlansSectionProps) {
  const [selected, setSelected] = useState<FloorPlan | null>(null);

  const rawItems = (includedItems && includedItems.length > 0)
    ? includedItems
    : ["Parking", "Storage", "AC"];
  const displayItems = rawItems.map(normalizeIncludedItem);

  const hasScarcity = (unitsRemaining !== null && unitsRemaining !== undefined) || nextPriceIncrease;

  return (
    <section id="floor-plans" className="relative py-16 sm:py-24 bg-muted/20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">

        {/* Header */}
        <div className="mb-10 sm:mb-14">
          <p className="text-primary text-xs font-semibold uppercase tracking-[0.2em] mb-2">02 — Hand-Picked For You</p>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-1.5">Top Picked Units</h2>
              <p className="text-muted-foreground text-sm max-w-lg">
                The best available units — tap any to see the full floor plan, size, and pricing.
              </p>
            </div>

            {/* Included in price — inline badge row */}
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold whitespace-nowrap">Included:</span>
              {displayItems.map((item, idx) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-background border border-border/70 text-foreground shadow-sm"
                >
                  {getIncludedIcon(rawItems[idx] || item)}
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Scarcity strip */}
          {hasScarcity && (
            <div className="flex flex-wrap items-center gap-3 mt-5">
              {unitsRemaining !== null && unitsRemaining !== undefined && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-destructive/8 border border-destructive/25">
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
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/8 border border-primary/25">
                  <TrendUp className="h-3.5 w-3.5 text-primary shrink-0" />
                  <p className="text-sm font-semibold text-primary">Next price increase: {nextPriceIncrease}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Floor plan grid */}
        {floorPlans.length === 0 ? (
          <div className="py-24 text-center">
            <LayoutPanelTop className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Floor plans coming soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {floorPlans.map((plan, idx) => {
              const psf = derivePsf(plan);
              return (
                <button
                  key={plan.id}
                  className="group relative text-left rounded-2xl overflow-hidden border-2 border-border bg-background hover:border-primary hover:shadow-2xl transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-[0.98] touch-manipulation"
                  onClick={() => setSelected(plan)}
                >
                  {/* Floor plan image — large proportion */}
                  <div className="relative overflow-hidden bg-muted/20" style={{ aspectRatio: "4/3" }}>
                    {plan.image_url ? (
                      <>
                        <img
                          src={plan.image_url}
                          alt={plan.unit_type}
                          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.04] p-3"
                        />
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <div className="flex items-center gap-2 bg-background/95 backdrop-blur-sm text-foreground font-semibold text-sm px-5 py-2.5 rounded-full shadow-lg border border-border/40">
                            <span>View Floor Plan</span>
                            <ArrowRight className="h-4 w-4 text-primary" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-muted/40 to-muted/20 gap-3">
                        <LayoutPanelTop className="h-12 w-12 text-muted-foreground/20" />
                        <span className="text-xs text-muted-foreground/50">Floor plan coming soon</span>
                      </div>
                    )}

                    {/* Unit number badge */}
                    <div className="absolute top-3 left-3">
                      <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                        #{idx + 1}
                      </span>
                    </div>
                  </div>

                  {/* Card info */}
                  <div className="p-4 sm:p-5 space-y-3">
                    {/* Unit type + price row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-foreground font-bold text-base sm:text-lg leading-tight">{plan.unit_type}</p>
                        {/* Beds / Baths */}
                        {(plan.beds || plan.baths) && (
                          <div className="flex items-center gap-2.5 mt-1">
                            {plan.beds && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <BedDouble className="h-3 w-3 shrink-0" />
                                {plan.beds} Bed
                              </span>
                            )}
                            {plan.baths && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Bath className="h-3 w-3 shrink-0" />
                                {plan.baths} Bath
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">From</p>
                        <p className="text-primary font-bold text-base sm:text-lg leading-tight">{plan.price_from || "—"}</p>
                      </div>
                    </div>

                    {/* Size + PSF row */}
                    <div className="flex items-center gap-3 pt-1 border-t border-border/40">
                      {plan.size_range && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Square className="h-3 w-3 shrink-0" />
                          {plan.size_range}
                        </span>
                      )}
                      {psf && (
                        <span className="ml-auto flex items-center gap-1 text-[11px] bg-primary/8 border border-primary/20 text-primary font-semibold px-2.5 py-1 rounded-full">
                          <TrendingUp className="h-2.5 w-2.5 shrink-0" />
                          {psf}/sqft
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
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
