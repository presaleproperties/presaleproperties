import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ZoomIn, ZoomOut, Square, TrendingUp } from "lucide-react";

export interface FloorPlan {
  id: string;
  unit_type: string;
  size_range: string;
  price_from: string;
  price_per_sqft?: string;
  tags: string[];
  image_url?: string;
  interior_sqft?: number | null;
  exterior_sqft?: number | null;
  beds?: number | null;
  baths?: number | null;
  exposure?: string | null;
  projected_rent?: number | null;
}

function derivePsf(plan: FloorPlan): string | null {
  if (plan.price_per_sqft?.trim()) return plan.price_per_sqft;
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

interface FloorPlanModalProps {
  plan: FloorPlan | null;
  onClose: () => void;
  allPlans?: FloorPlan[];
}

export function FloorPlanModal({ plan, onClose, allPlans }: FloorPlanModalProps) {
  const [zoomed, setZoomed] = useState(false);

  if (!plan) return null;

  return (
    <Dialog open={!!plan} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-3xl p-0 overflow-hidden gap-0 border-border/50 max-h-[100dvh] sm:max-h-[92dvh] rounded-none sm:rounded-2xl">
        {/* Mobile: stacked. Desktop: side-by-side */}
        <div className="flex flex-col md:grid md:grid-cols-[1fr_260px] h-full overflow-y-auto md:overflow-hidden max-h-[100dvh] sm:max-h-[92dvh]">

          {/* Image panel */}
          <div className="relative bg-muted/30 flex items-center justify-center min-h-[220px] md:min-h-[420px] overflow-hidden order-1 shrink-0">
            {plan.image_url ? (
              <div
                className={`w-full h-full transition-transform duration-500 ${zoomed ? "scale-150 cursor-zoom-out" : "scale-100 cursor-zoom-in"} flex items-center justify-center p-4`}
                onClick={() => setZoomed(!zoomed)}
              >
                <img
                  src={plan.image_url}
                  alt={`${plan.unit_type} floor plan`}
                  className="max-h-[260px] md:max-h-[380px] w-auto object-contain select-none"
                  draggable={false}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 opacity-30 py-12">
                <div className="w-16 h-16 border-2 border-foreground/30 rounded-xl flex items-center justify-center">
                  <Square className="h-7 w-7 text-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground">Floor plan preview coming soon</p>
              </div>
            )}

            {plan.image_url && (
              <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-background/70 backdrop-blur-sm rounded-full px-2.5 py-1 text-[10px] text-muted-foreground border border-border/40 pointer-events-none">
                {zoomed ? <ZoomOut className="h-3 w-3" /> : <ZoomIn className="h-3 w-3" />}
                <span className="hidden sm:inline">{zoomed ? "Tap to zoom out" : "Tap to zoom in"}</span>
              </div>
            )}
          </div>

          {/* Info panel */}
          <div className="flex flex-col p-4 sm:p-5 md:p-6 border-t md:border-t-0 md:border-l border-border/50 bg-background order-2">
            {/* Close — top right always */}
            <button
              onClick={onClose}
              className="self-end p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground mb-2"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Unit type */}
            <div className="mb-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Unit Type</p>
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">{plan.unit_type}</h3>
            </div>

            {/* Price */}
            <div className="rounded-xl bg-primary/8 border border-primary/15 p-3 sm:p-4 mb-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Starting From</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">{plan.price_from}</p>
            </div>

            {/* Size + psf */}
            <div className="space-y-3 mb-4">
              {plan.size_range && (
                <div className="flex items-center gap-2 pb-3 border-b border-border/50">
                  <Square className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">Size</p>
                    <p className="text-sm font-semibold text-foreground">{plan.size_range}</p>
                  </div>
                </div>
              )}
              {(() => {
                const psf = derivePsf(plan);
                return psf ? (
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5 text-primary shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">Price / sqft</p>
                      <p className="text-sm font-bold text-primary">{psf} <span className="font-normal text-muted-foreground">/ sqft</span></p>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>

            {/* CTA */}
            <Button
              className="w-full mt-auto touch-manipulation"
              onClick={() => { onClose(); document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" }); }}
            >
              Inquire About This Unit
            </Button>
            <p className="text-[10px] text-muted-foreground text-center mt-2">No obligation · Private showing available</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
