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

export function FloorPlanModal({ plan, onClose }: FloorPlanModalProps) {
  const [zoomed, setZoomed] = useState(false);

  if (!plan) return null;

  const psf = derivePsf(plan);

  return (
    <Dialog open={!!plan} onOpenChange={onClose}>
      {/* Wide modal — image-first, side panel on desktop */}
      <DialogContent className="w-full max-w-5xl p-0 overflow-hidden gap-0 border-border/50 rounded-t-2xl sm:rounded-2xl max-h-[95dvh] flex flex-col">

        {/* Close button — always visible top-right */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-50 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shadow-md"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Scrollable inner wrapper */}
        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_300px] overflow-y-auto overflow-x-hidden flex-1 min-h-0">

          {/* ── Image panel — dominant ── */}
          <div
            className="relative bg-muted/20 flex items-center justify-center overflow-hidden shrink-0 lg:shrink"
            style={{ minHeight: "clamp(260px, 48dvh, 640px)" }}
            onClick={() => setZoomed(!zoomed)}
          >
            {plan.image_url ? (
              <div
                className={`w-full h-full flex items-center justify-center p-3 sm:p-6 transition-transform duration-300 origin-center ${zoomed ? "scale-[2.2] cursor-zoom-out" : "scale-100 cursor-zoom-in"}`}
              >
                <img
                  src={plan.image_url}
                  alt={`${plan.unit_type} floor plan`}
                  className="w-full h-full object-contain select-none"
                  style={{ maxHeight: "clamp(240px, 46dvh, 620px)" }}
                  draggable={false}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 opacity-30 py-16">
                <div className="w-20 h-20 border-2 border-foreground/30 rounded-xl flex items-center justify-center">
                  <Square className="h-9 w-9 text-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground">Floor plan preview coming soon</p>
              </div>
            )}

            {/* Zoom hint */}
            {plan.image_url && (
              <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-background/75 backdrop-blur-sm rounded-full px-3 py-1.5 text-[11px] text-muted-foreground border border-border/40 pointer-events-none select-none">
                {zoomed ? <ZoomOut className="h-3.5 w-3.5" /> : <ZoomIn className="h-3.5 w-3.5" />}
                <span>{zoomed ? "Tap to zoom out" : "Tap to zoom in"}</span>
              </div>
            )}
          </div>

          {/* ── Info panel ── */}
          <div className="flex flex-col p-5 sm:p-6 border-t lg:border-t-0 lg:border-l border-border/50 bg-background">

            {/* Unit type */}
            <div className="mb-4 pr-8">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Unit Type</p>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">{plan.unit_type}</h3>
            </div>

            {/* Price */}
            <div className="rounded-xl bg-primary/8 border border-primary/15 p-4 mb-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Starting From</p>
              <p className="text-2xl sm:text-3xl font-bold text-primary">{plan.price_from}</p>
            </div>

            {/* Size + PSF */}
            <div className="space-y-3 mb-5">
              {plan.size_range && (
                <div className="flex items-center gap-3 pb-3 border-b border-border/50">
                  <Square className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">Size</p>
                    <p className="text-sm font-semibold text-foreground">{plan.size_range}</p>
                  </div>
                </div>
              )}
              {psf && (
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">Price / sqft</p>
                    <p className="text-sm font-bold text-primary">
                      {psf} <span className="font-normal text-muted-foreground">/ sqft</span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* CTA */}
            <Button
              className="w-full mt-auto touch-manipulation"
              size="lg"
              onClick={() => {
                onClose();
                document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Inquire About This Unit
            </Button>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              No obligation · Private showing available
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
