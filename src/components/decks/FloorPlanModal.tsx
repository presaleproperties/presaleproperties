import { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { X, ZoomIn, ZoomOut, Square, TrendingUp, MessageCircle, Maximize2, Car, Archive, Wind, CheckCircle2, Lock as LockIcon, ArrowRight } from "lucide-react";

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

const INCLUDED_ICON_MAP: Record<string, React.ReactNode> = {
  parking: <Car className="h-3.5 w-3.5 shrink-0" />,
  storage: <Archive className="h-3.5 w-3.5 shrink-0" />,
  locker: <Archive className="h-3.5 w-3.5 shrink-0" />,
  ac: <Wind className="h-3.5 w-3.5 shrink-0" />,
  "air conditioning": <Wind className="h-3.5 w-3.5 shrink-0" />,
};
function getIncludedIcon(item: string) {
  const lower = item.toLowerCase();
  for (const [key, icon] of Object.entries(INCLUDED_ICON_MAP)) {
    if (lower.includes(key)) return icon;
  }
  return <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />;
}

interface FloorPlanModalProps {
  plan: FloorPlan | null;
  onClose: () => void;
  whatsappNumber?: string;
  projectName?: string;
  allPlans?: FloorPlan[];
  includedItems?: string[];
  isUnlocked?: boolean;
  onUnlockRequest?: () => void;
}

export function FloorPlanModal({ plan, onClose, whatsappNumber, projectName, includedItems, isUnlocked = false, onUnlockRequest }: FloorPlanModalProps) {
  const [zoomed, setZoomed] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });
  const hasDragged = useRef(false);

  const resetZoom = useCallback(() => {
    setZoomed(false);
    setPan({ x: 0, y: 0 });
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!zoomed) return;
    isDragging.current = true;
    hasDragged.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY };
    panStart.current = { ...pan };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  }, [zoomed, pan]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDragged.current = true;
    setPan({ x: panStart.current.x + dx, y: panStart.current.y + dy });
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    isDragging.current = false;
  }, []);

  const handleImageClick = useCallback(() => {
    if (hasDragged.current) { hasDragged.current = false; return; }
    if (zoomed) { resetZoom(); } else { setZoomed(true); setPan({ x: 0, y: 0 }); }
  }, [zoomed, resetZoom]);

  const prevPlanId = useRef<string | null>(null);
  if (plan && plan.id !== prevPlanId.current) {
    prevPlanId.current = plan.id;
    // Reset zoom on plan change
  }

  if (!plan) return null;

  const psf = derivePsf(plan);
  const waNumber = (whatsappNumber || "17782313592").replace(/\D/g, "");
  const waMessage = encodeURIComponent(
    `Hi! I'm interested in the ${plan.unit_type}${plan.price_from ? ` (from ${plan.price_from})` : ""}${projectName ? ` at ${projectName}` : ""} — can you share more details?`
  );
  const waUrl = `https://wa.me/${waNumber}?text=${waMessage}`;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ height: "100dvh" }}
      onClick={(e) => { if (e.target === e.currentTarget) { resetZoom(); onClose(); } }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => { resetZoom(); onClose(); }} />

      {/* Modal */}
      <div
        className="relative w-full sm:max-w-5xl xl:max-w-6xl bg-background rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col sm:flex-row shadow-2xl border border-border/30"
        style={{
          maxHeight: "96dvh",
          height: "96dvh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={() => { resetZoom(); onClose(); }}
          className="absolute top-3 right-3 z-50 p-2 rounded-full bg-background/90 backdrop-blur-sm border border-border/50 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shadow-md"
        >
          <X className="h-4 w-4" />
        </button>

        {/* ── IMAGE — takes ALL the space on left (desktop) / top (mobile) ── */}
        <div
          className={`relative bg-muted/5 flex items-center justify-center select-none flex-1 min-h-0 ${
            zoomed ? "overflow-hidden cursor-grab active:cursor-grabbing" : "overflow-hidden cursor-zoom-in"
          }`}
          style={{ minHeight: "55dvh" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onClick={handleImageClick}
        >
          {plan.image_url ? (
            <div
              style={{
                transform: zoomed
                  ? `scale(2.8) translate(${pan.x / 2.8}px, ${pan.y / 2.8}px)`
                  : "scale(1) translate(0px, 0px)",
                transition: isDragging.current ? "none" : "transform 0.28s ease",
                transformOrigin: "center center",
                willChange: "transform",
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0",
              }}
            >
              <img
                src={plan.image_url}
                alt={`${plan.unit_type} floor plan`}
                className="object-contain"
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  width: "auto",
                  height: "auto",
                  padding: "12px",
                }}
                draggable={false}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 opacity-30 py-16">
              <Maximize2 className="h-16 w-16 text-foreground/20" />
              <p className="text-sm text-muted-foreground">Floor plan preview coming soon</p>
            </div>
          )}

          {/* Zoom hint */}
          {plan.image_url && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-background/80 backdrop-blur-sm rounded-full px-3 py-1.5 text-[11px] text-muted-foreground border border-border/40 pointer-events-none select-none shadow-sm">
              {zoomed ? <ZoomOut className="h-3.5 w-3.5" /> : <ZoomIn className="h-3.5 w-3.5" />}
              <span>{zoomed ? "Drag to pan · Tap to zoom out" : "Tap to zoom"}</span>
            </div>
          )}
        </div>

        {/* ── INFO PANEL — slim right column / bottom sheet on mobile ── */}
        <div className="flex flex-col p-5 sm:p-6 border-t sm:border-t-0 sm:border-l border-border/40 bg-background sm:w-[240px] xl:w-[260px] shrink-0 overflow-y-auto">

          {/* Unit type */}
          <div className="mb-4 pr-7">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">Unit Type</p>
            <h3 className="text-xl font-bold text-foreground leading-tight">{plan.unit_type}</h3>
          </div>

          {/* Price — gated when locked */}
          {isUnlocked ? (
            <div className="rounded-xl bg-primary/8 border border-primary/15 px-4 py-3 mb-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">Starting From</p>
              <p className="text-2xl font-bold text-primary leading-tight">{plan.price_from || "—"}</p>
            </div>
          ) : (
            <button
              onClick={onUnlockRequest}
              className="w-full rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 px-4 py-3 mb-4 flex flex-col items-center gap-1.5 hover:bg-primary/10 hover:border-primary/60 transition-all group"
            >
              <div className="flex items-center gap-2">
                <LockIcon className="h-4 w-4 text-primary shrink-0" />
                <p className="text-sm font-bold text-primary">Exclusive Pricing</p>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                This is private, invite-only pricing.
              </p>
              <span className="flex items-center gap-1 text-[11px] font-bold text-primary-foreground bg-primary px-3 py-1 rounded-full mt-0.5 group-hover:bg-primary/80 transition-colors">
                Unlock Price <ArrowRight className="h-3 w-3" />
              </span>
            </button>
          )}

          {/* Details */}
          <div className="space-y-3 mb-4">
            {plan.size_range && (
              <div className="flex items-center gap-2.5 pb-3 border-b border-border/40">
                <Square className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">Size</p>
                  <p className="text-sm font-semibold text-foreground">{plan.size_range}</p>
                </div>
              </div>
            )}
            {psf && (
              <div className="flex items-center gap-2.5 pb-3 border-b border-border/40">
                <TrendingUp className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">Price / sqft</p>
                  <p className="text-sm font-bold text-primary">
                    {psf} <span className="font-normal text-muted-foreground">/ sqft</span>
                  </p>
                </div>
              </div>
            )}
            {/* Included items */}
            {includedItems && includedItems.length > 0 && (
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Included</p>
                <div className="flex flex-col gap-1.5">
                  {includedItems.map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm text-foreground">
                      <span className="text-primary shrink-0">{getIncludedIcon(item)}</span>
                      <span className="font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* CTA */}
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full mt-auto"
            onClick={onClose}
          >
            <Button
              className="w-full touch-manipulation gap-2"
              size="lg"
              style={{ background: "#25D366", boxShadow: "0 4px 16px rgba(37,211,102,0.30)" }}
            >
              <MessageCircle className="h-4 w-4" />
              I'm Interested
            </Button>
          </a>
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            No obligation · Private showing available
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
