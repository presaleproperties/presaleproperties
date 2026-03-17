import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, ZoomIn, ZoomOut, Maximize2, Square, Tag, ChevronLeft, ChevronRight } from "lucide-react";

export interface FloorPlan {
  id: string;
  unit_type: string;
  size_range: string;
  price_from: string;
  price_per_sqft?: string;
  tags: string[];
  image_url?: string;
}

interface FloorPlanModalProps {
  plan: FloorPlan | null;
  onClose: () => void;
  allPlans?: FloorPlan[];
}

export function FloorPlanModal({ plan, onClose, allPlans }: FloorPlanModalProps) {
  const [zoomed, setZoomed] = useState(false);

  if (!plan) return null;

  const currentIdx = allPlans?.findIndex((p) => p.id === plan.id) ?? -1;
  const hasPrev = allPlans && currentIdx > 0;
  const hasNext = allPlans && currentIdx < allPlans.length - 1;

  return (
    <Dialog open={!!plan} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden gap-0 border-border/50">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px]">
          {/* Image panel */}
          <div className="relative bg-muted/30 flex items-center justify-center min-h-[300px] md:min-h-[420px] overflow-hidden">
            {plan.image_url ? (
              <div
                className={`w-full h-full cursor-zoom-${zoomed ? "out" : "in"} transition-transform duration-500 ${zoomed ? "scale-150" : "scale-100"} flex items-center justify-center p-4`}
                onClick={() => setZoomed(!zoomed)}
              >
                <img
                  src={plan.image_url}
                  alt={`${plan.unit_type} floor plan`}
                  className="max-h-[380px] w-auto object-contain select-none"
                  draggable={false}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 opacity-30 py-16">
                <div className="w-20 h-20 border-2 border-foreground/30 rounded-xl flex items-center justify-center">
                  <Square className="h-8 w-8 text-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground">Floor plan preview coming soon</p>
              </div>
            )}

            {/* Zoom hint */}
            {plan.image_url && (
              <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-background/70 backdrop-blur-sm rounded-full px-2.5 py-1 text-[10px] text-muted-foreground border border-border/40 pointer-events-none">
                {zoomed ? <ZoomOut className="h-3 w-3" /> : <ZoomIn className="h-3 w-3" />}
                <span>{zoomed ? "Click to zoom out" : "Click to zoom in"}</span>
              </div>
            )}

            {/* Navigation arrows */}
            {hasPrev && (
              <button
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 flex items-center justify-center hover:bg-background transition-colors shadow-sm"
                onClick={(e) => { e.stopPropagation(); /* handled by parent */ }}
              >
                <ChevronLeft className="h-4 w-4 text-foreground" />
              </button>
            )}
            {hasNext && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 flex items-center justify-center hover:bg-background transition-colors shadow-sm"
                onClick={(e) => { e.stopPropagation(); /* handled by parent */ }}
              >
                <ChevronRight className="h-4 w-4 text-foreground" />
              </button>
            )}
          </div>

          {/* Info panel */}
          <div className="flex flex-col p-6 border-l border-border/50 bg-background">
            {/* Close */}
            <button
              onClick={onClose}
              className="self-end -mt-1 -mr-1 p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground mb-4"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Unit type */}
            <div className="space-y-1 mb-6">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Unit Type</p>
              <h3 className="text-2xl font-bold text-foreground">{plan.unit_type}</h3>
            </div>

            {/* Price */}
            <div className="rounded-xl bg-primary/8 border border-primary/15 p-4 mb-5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Starting From</p>
              <p className="text-3xl font-bold text-primary">{plan.price_from}</p>
            </div>

            {/* Size */}
            {plan.size_range && (
              <div className="flex items-center gap-2 mb-5 pb-5 border-b border-border/50">
                <Square className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">Size</p>
                  <p className="text-sm font-semibold text-foreground">{plan.size_range}</p>
                </div>
              </div>
            )}

            {/* Price / sqft */}
            {plan.price_per_sqft && (
              <div className="flex items-center gap-2 mb-auto pb-5 border-b border-border/50">
                <Square className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">Price / sqft</p>
                  <p className="text-sm font-semibold text-foreground">{plan.price_per_sqft}</p>
                </div>
              </div>
            )}

            {/* CTA */}
            <Button
              className="w-full mt-6"
              onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
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
