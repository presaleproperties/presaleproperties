import { useState } from "react";
import { FloorPlanModal, FloorPlan } from "./FloorPlanModal";
import { DeckPriceGate } from "./DeckPriceGate";
import {
  LayoutPanelTop, ArrowRight, Square, TrendingUp, Car, Archive, Wind,
  CheckCircle2, Flame, TrendingUp as TrendUp, BedDouble, Bath, Lock as LockIcon,
} from "lucide-react";

function parseCredit(credit?: string): number {
  if (!credit) return 0;
  const match = credit.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : 0;
}

function derivePsf(plan: FloorPlan): string | null {
  if (plan.price_per_sqft && plan.price_per_sqft.trim()) return plan.price_per_sqft;
  let price = parseFloat((plan.price_from || "").replace(/[^0-9.]/g, ""));
  const credit = parseCredit(plan.exclusive_credit);
  if (credit > 0 && price > credit) price -= credit;
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
  projectId?: string | null;
  slug?: string;
  assignmentFee?: string | null;
  includedItems?: string[] | null;
  unitsRemaining?: number | null;
  nextPriceIncrease?: string | null;
  incentives?: string[] | null;
  isUnlocked?: boolean;
  onUnlock?: () => void;
  onUnlockRequest?: () => void;
}

export function DeckFloorPlansSection({
  floorPlans,
  whatsappNumber,
  projectName,
  projectId,
  slug,
  includedItems,
  unitsRemaining,
  nextPriceIncrease,
  incentives,
  isUnlocked = false,
  onUnlock,
}: DeckFloorPlansSectionProps) {
  const [selected, setSelected] = useState<FloorPlan | null>(null);
  const [priceGateOpen, setPriceGateOpen] = useState(false);

  const rawItems = (includedItems && includedItems.length > 0) ? includedItems : ["Parking", "Storage", "AC"];
  const displayItems = rawItems.map(normalizeIncludedItem);
  const hasScarcity = (unitsRemaining !== null && unitsRemaining !== undefined) || nextPriceIncrease;

  const handleRevealPrice = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isUnlocked) setPriceGateOpen(true);
  };

  return (
    <section id="floor-plans" className="relative py-16 sm:py-24 bg-muted/20 overflow-hidden">

      {/* Price gate modal — only triggered on demand, never on page load */}
      {priceGateOpen && !isUnlocked && (
        <DeckPriceGate
          slug={slug || ""}
          projectName={projectName || ""}
          projectId={projectId}
          onUnlock={() => {
            setPriceGateOpen(false);
            onUnlock?.();
          }}
          onClose={() => setPriceGateOpen(false)}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-8">

        {/* Header */}
        <div className="mb-10 sm:mb-14">
          <p className="text-primary text-xs font-semibold uppercase tracking-[0.2em] mb-2">02 — Hand-Picked For You</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-1.5">Top Picked Units</h2>
          <p className="text-muted-foreground text-sm max-w-lg">
            The best available units — tap any to see the full floor plan.{!isUnlocked && " Pricing is exclusive and invite-only — tap Reveal Price to unlock."}
          </p>

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

          {/* Incentives banner */}
          {incentives && incentives.length > 0 && (
            <div className="mt-5 p-4 rounded-2xl bg-primary/5 border border-primary/20 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 shrink-0">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Developer Incentives</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {incentives.map((item, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary text-primary-foreground shadow-sm"
                  >
                    <CheckCircle2 className="h-3 w-3 shrink-0" />
                    {item}
                  </span>
                ))}
              </div>
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
                  {/* Floor plan image */}
                  <div className="relative overflow-hidden bg-muted/20" style={{ aspectRatio: "4/3" }}>
                    {plan.image_url ? (
                      <>
                        <img
                          src={plan.image_url}
                          alt={plan.unit_type}
                          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.04] p-3"
                        />
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

                       {/* Price — clear when unlocked, full-width CTA when locked */}
                       <div className="text-right shrink-0">
                         {isUnlocked ? (
                           <div className="flex flex-col items-end gap-0.5">
                             <p className="text-[10px] text-muted-foreground uppercase tracking-wider">From</p>
                             <p className="text-primary font-bold text-lg sm:text-xl leading-none tracking-tight">{plan.price_from?.startsWith('$') ? plan.price_from : `$${plan.price_from}`}</p>
              {plan.exclusive_credit && (
                <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-500/12 text-green-600 text-[11px] font-semibold leading-tight">
                  <span className="font-bold">Exclusive Credit: {plan.exclusive_credit.startsWith('$') ? plan.exclusive_credit : `$${plan.exclusive_credit}`}</span>
                </span>
              )}
                           </div>
                         ) : (
                           <button
                             onClick={handleRevealPrice}
                             className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 active:scale-95 transition-all shadow-sm shadow-primary/30"
                           >
                             <LockIcon className="h-3 w-3 shrink-0" />
                             Reveal Price
                           </button>
                         )}
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
                        isUnlocked ? (
                          <span className="ml-auto flex items-center gap-1 text-[11px] bg-primary/8 border border-primary/20 text-primary font-semibold px-2.5 py-1 rounded-full">
                            <TrendingUp className="h-2.5 w-2.5 shrink-0" />
                            {psf}/sqft
                          </span>
                        ) : (
                          <span className="ml-auto flex items-center gap-1 text-[11px] bg-muted/60 border border-border/40 text-muted-foreground px-2.5 py-1 rounded-full blur-sm select-none">
                            <TrendingUp className="h-2.5 w-2.5 shrink-0" />
                            {psf}/sqft
                          </span>
                        )
                      )}
                    </div>

                    {/* Included items */}
                    {displayItems.length > 0 && (
                      <div className="pt-1 border-t border-border/30 space-y-1">
                        <p className="text-[8px] uppercase tracking-widest text-muted-foreground/70 font-semibold">Included in price</p>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {displayItems.map((item, i) => (
                            <span
                              key={item}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium bg-muted/60 border border-border/50 text-muted-foreground"
                            >
                              {getIncludedIcon(rawItems[i] || item)}
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Reveal pricing banner — below the grid when locked */}
        {!isUnlocked && floorPlans.length > 0 && (
          <div className="mt-8 p-5 sm:p-6 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/8 to-primary/3 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left shadow-sm">
            <div className="h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center shrink-0 shadow-inner">
              <LockIcon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-foreground text-sm sm:text-base">This pricing is exclusive — not publicly listed</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-md">
                This deck was shared with a select group of buyers only. To protect the integrity of this offering, pricing is revealed only after we know who's on the other side. It takes 30 seconds.
              </p>
            </div>
            <button
              onClick={() => setPriceGateOpen(true)}
              className="shrink-0 h-11 px-6 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center gap-2 hover:bg-primary/90 active:scale-95 transition-all shadow-lg shadow-primary/25"
            >
              <LockIcon className="h-4 w-4" />
              Unlock Exclusive Pricing <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <FloorPlanModal
        plan={selected}
        onClose={() => setSelected(null)}
        whatsappNumber={whatsappNumber}
        projectName={projectName}
        includedItems={displayItems}
        isUnlocked={isUnlocked}
        onUnlockRequest={() => { setSelected(null); setTimeout(() => setPriceGateOpen(true), 150); }}
      />
    </section>
  );
}
