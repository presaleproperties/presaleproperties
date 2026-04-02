import { useState } from "react";
import { FloorPlanModal, type FloorPlan } from "@/components/decks/FloorPlanModal";
import { trackOffMarketEvent } from "@/lib/offMarketAnalytics";
import {
  LayoutPanelTop, ArrowRight, Square, TrendingUp, BedDouble, Bath,
  Car, Archive, CheckCircle2, Flame, Switch as SwitchIcon,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

function derivePsf(plan: FloorPlan): string | null {
  if (plan.price_per_sqft?.trim()) return plan.price_per_sqft;
  const price = parseFloat((plan.price_from || "").replace(/[^0-9.]/g, ""));
  const sqft = plan.interior_sqft;
  if (price > 0 && sqft && sqft > 0) return `$${Math.round(price / sqft).toLocaleString()}`;
  return null;
}

const INCLUDED_ICONS: Record<string, React.ReactNode> = {
  parking: <Car className="h-3.5 w-3.5 shrink-0" />,
  storage: <Archive className="h-3.5 w-3.5 shrink-0" />,
  locker: <Archive className="h-3.5 w-3.5 shrink-0" />,
};
function getIncludedIcon(item: string) {
  const lower = item.toLowerCase();
  for (const [key, icon] of Object.entries(INCLUDED_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />;
}

interface OffMarketUnitsSectionProps {
  units: FloorPlan[];
  allUnits: any[];
  includedItems: string[];
  projectName: string;
  onSelectPlan: (plan: FloorPlan) => void;
  listingId: string;
}

export function OffMarketUnitsSection({
  units,
  allUnits,
  includedItems,
  projectName,
  onSelectPlan,
  listingId,
}: OffMarketUnitsSectionProps) {
  const [showSold, setShowSold] = useState(false);

  const soldUnits = allUnits.filter(u => u.status === "sold");
  const availableCount = allUnits.filter(u => u.status === "available").length;

  // If showing sold, add them back
  const displayUnits = showSold
    ? [
        ...units,
        ...soldUnits.map((u: any) => ({
          id: u.id,
          unit_type: u.unit_name || u.unit_type || `Unit ${u.unit_number}`,
          size_range: u.sqft ? `${Number(u.sqft).toLocaleString()} sqft` : "",
          price_from: u.price ? `$${Number(u.price).toLocaleString()}` : "",
          price_per_sqft: u.price_per_sqft ? `$${Math.round(Number(u.price_per_sqft))}` : "",
          tags: ["sold"],
          image_url: u.floorplan_url || u.floorplan_thumbnail_url || undefined,
          interior_sqft: u.sqft ? Number(u.sqft) : null,
          beds: u.bedrooms,
          baths: u.bathrooms ? Number(u.bathrooms) : null,
          exposure: u.orientation,
          projected_rent: null,
          _sold: true,
        })),
      ]
    : units;

  return (
    <section id="floor-plans" className="relative py-16 sm:py-24 bg-muted/20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">

        {/* Header */}
        <div className="mb-10 sm:mb-14">
          <p className="text-primary text-xs font-semibold uppercase tracking-[0.2em] mb-2">
            02 — Exclusive Inventory
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-1.5">
            Available Units
          </h2>
          <p className="text-muted-foreground text-sm max-w-lg">
            Tap any unit to see the full floor plan and details. All pricing is VIP-exclusive.
          </p>

          {/* Availability + sold toggle */}
          <div className="flex flex-wrap items-center gap-4 mt-5">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/8 border border-primary/25">
              <Flame className="h-3.5 w-3.5 text-primary shrink-0" />
              <p className="text-sm font-semibold text-primary">
                {availableCount} {availableCount === 1 ? "unit" : "units"} available
              </p>
            </div>
            {soldUnits.length > 0 && (
              <div className="flex items-center gap-2">
                <Switch id="show-sold-toggle" checked={showSold} onCheckedChange={setShowSold} />
                <Label htmlFor="show-sold-toggle" className="text-sm text-muted-foreground cursor-pointer">
                  Show sold units ({soldUnits.length})
                </Label>
              </div>
            )}
          </div>
        </div>

        {/* Unit card grid — identical to deck floor plan cards */}
        {displayUnits.length === 0 ? (
          <div className="py-24 text-center">
            <LayoutPanelTop className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No units to display</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {displayUnits.map((plan, idx) => {
              const psf = derivePsf(plan);
              const isSold = (plan as any)._sold || plan.tags?.includes("sold");

              return (
                <button
                  key={plan.id}
                  className={`group relative text-left rounded-2xl overflow-hidden border-2 bg-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-[0.98] touch-manipulation ${
                    isSold
                      ? "border-border/40 opacity-60 cursor-default"
                      : "border-border hover:border-primary hover:shadow-2xl"
                  }`}
                  onClick={() => {
                    if (!isSold) {
                      onSelectPlan(plan);
                      trackOffMarketEvent("unit_view", listingId, plan.id);
                    }
                  }}
                >
                  {/* Sold overlay */}
                  {isSold && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center">
                      <Badge className="bg-red-500/90 text-white text-sm font-bold px-4 py-1.5 shadow-lg">SOLD</Badge>
                    </div>
                  )}

                  {/* Floor plan image */}
                  <div className="relative overflow-hidden bg-muted/20" style={{ aspectRatio: "4/3" }}>
                    {plan.image_url ? (
                      <>
                        <img
                          src={plan.image_url}
                          alt={plan.unit_type}
                          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.04] p-3"
                          loading="lazy"
                        />
                        {!isSold && (
                          <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <div className="flex items-center gap-2 bg-background/95 backdrop-blur-sm text-foreground font-semibold text-sm px-5 py-2.5 rounded-full shadow-lg border border-border/40">
                              <span>View Floor Plan</span>
                              <ArrowRight className="h-4 w-4 text-primary" />
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-muted/40 to-muted/20 gap-3">
                        <LayoutPanelTop className="h-12 w-12 text-muted-foreground/20" />
                        <span className="text-xs text-muted-foreground/50">Floor plan preview</span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                        #{idx + 1}
                      </span>
                    </div>
                  </div>

                  {/* Card info */}
                  <div className="p-4 sm:p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-foreground font-bold text-base sm:text-lg leading-tight">{plan.unit_type}</p>
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

                    {/* Size + PSF */}
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

                    {/* Included items */}
                    {includedItems.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/30">
                        {includedItems.map((item) => (
                          <span
                            key={item}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium bg-muted/60 border border-border/50 text-muted-foreground"
                          >
                            {getIncludedIcon(item)}
                            {item}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
