import { useState } from "react";
import { FileText, LayoutGrid, DollarSign, ArrowRight, Lock, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FloorPlanModal } from "./FloorPlanModal";

interface ProjectDocumentsCTAProps {
  projectId: string;
  projectName: string;
  status: "coming_soon" | "registering" | "active" | "sold_out";
  brochureUrl?: string | null;
  floorplanUrl?: string | null;
  pricingUrl?: string | null;
  unitMix?: string | null;
}

const DOCUMENTS = [
  { label: "Floor Plans", icon: LayoutGrid, desc: "All unit layouts & sizes" },
  { label: "Brochure", icon: FileText, desc: "Full project details" },
  { label: "Pricing Sheet", icon: DollarSign, desc: "Current price list" },
];

/**
 * Parse the free-text unit_mix field into display-friendly tabs.
 * Examples: "1-3 bedrooms", "Studio, 1 Bed, 2 Bed + Den", "1BR, 2BR, 3BR"
 */
function parseUnitMix(unitMix: string | null | undefined): string[] {
  if (!unitMix) return ["1 Bed", "2 Bed", "3 Bed"];

  const raw = unitMix.toLowerCase().trim();

  // Range pattern: "1-3 bedrooms" or "1 to 3 bed"
  const rangeMatch = raw.match(/(\d)\s*[-–to]+\s*(\d)\s*(bed|br)/i);
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1]);
    const end = parseInt(rangeMatch[2]);
    const types: string[] = [];
    for (let i = start; i <= end; i++) {
      types.push(i === 0 ? "Studio" : `${i} Bed`);
    }
    return types;
  }

  // Comma/slash separated: "Studio, 1 Bed, 2 Bed + Den"
  const parts = unitMix.split(/[,/;]+/).map((s) => s.trim()).filter(Boolean);
  if (parts.length > 1) {
    return parts.map((p) => {
      const cleaned = p.replace(/bedrooms?|brs?/gi, "Bed").trim();
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    });
  }

  // Single value fallback
  return [unitMix.trim()];
}

export function ProjectDocumentsCTA({
  projectId,
  projectName,
  status,
  brochureUrl,
  floorplanUrl,
  pricingUrl,
  unitMix,
}: ProjectDocumentsCTAProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const unitTypes = parseUnitMix(unitMix);

  return (
    <>
      <section className="space-y-5 sm:space-y-6">
        {/* Floor Plan Preview - Blurred teaser */}
        <div className="relative rounded-xl sm:rounded-2xl overflow-hidden border border-border/40 bg-background/60">
          <div className="p-4 sm:p-6">
            {/* Unit type tabs from real data */}
            <h3 className="text-lg sm:text-xl font-bold text-foreground mb-4">Floor Plans</h3>
            <div className="flex gap-1.5 sm:gap-2 mb-4 overflow-x-auto pb-1">
              {unitTypes.map((type) => (
                <div
                  key={type}
                  className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg bg-muted/60 text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap border border-border/30"
                >
                  {type}
                </div>
              ))}
            </div>

            {/* Blurred floor plan rows */}
            <div className="relative rounded-xl overflow-hidden">
              <div className="blur-[6px] pointer-events-none select-none">
                {[1, 2, 3].map((row) => (
                  <div
                    key={row}
                    className="flex items-center gap-4 py-4 border-b border-border/20 last:border-0"
                  >
                    <div className="w-20 h-16 sm:w-24 sm:h-20 rounded-lg bg-muted/70 flex-shrink-0 flex items-center justify-center border border-border/30">
                      <LayoutGrid className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="h-4 w-32 bg-muted-foreground/12 rounded mb-2" />
                      <div className="h-3 w-20 bg-muted-foreground/8 rounded" />
                    </div>
                    <div className="text-right flex-shrink-0 hidden sm:block">
                      <div className="h-4 w-16 bg-muted-foreground/12 rounded mb-2" />
                      <div className="h-3 w-12 bg-muted-foreground/8 rounded" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Dark overlay with CTA */}
              <div className="absolute inset-0 bg-foreground/65 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 rounded-xl">
                <div className="flex items-center gap-2 text-primary">
                  <Eye className="h-5 w-5" />
                  <span className="text-sm font-semibold uppercase tracking-wider">Preview Available</span>
                </div>
                <Button
                  size="lg"
                  onClick={() => setModalOpen(true)}
                  className="h-12 sm:h-14 px-8 sm:px-10 text-sm sm:text-base font-bold rounded-xl shadow-gold hover:shadow-gold-glow"
                >
                  Unlock Prices + Floor Plans
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                <p className="text-background/50 text-xs sm:text-sm mt-1">
                  Free & instant — no obligation
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Document Cards - transparent style */}
        <div className="rounded-xl sm:rounded-2xl border border-border/40 overflow-hidden bg-background/40">
          <div className="p-5 sm:p-6 md:p-8">
            {/* Header with clear value prop */}
            <div className="mb-5 sm:mb-6">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-primary mb-1.5 block">
                What You'll Receive
              </span>
              <h3 className="text-base sm:text-lg font-bold text-foreground">
                Brochure, Floor Plans & Pricing — Sent to Your Inbox
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
                Register below to instantly receive the full {projectName} document package including brochure, all available floor plans, and the current pricing sheet.
              </p>
            </div>

            {/* Document cards - all locked */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5 sm:mb-6">
              {DOCUMENTS.map(({ label, icon: Icon, desc }) => (
                <button
                  key={label}
                  onClick={() => setModalOpen(true)}
                  className="relative group bg-background/60 border border-border/50 rounded-xl sm:rounded-2xl p-3 sm:p-5 text-center transition-all duration-200 hover:border-primary/40 hover:shadow-sm cursor-pointer"
                >
                  <div className="flex flex-col items-center gap-2 sm:gap-3">
                    <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-primary/8 flex items-center justify-center transition-colors group-hover:bg-primary/12">
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-semibold text-foreground leading-tight block">
                        {label}
                      </span>
                      <span className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 hidden sm:block">
                        {desc}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground/60">
                      <Lock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      <span className="text-[10px] sm:text-xs font-medium">Locked</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button
                size="lg"
                className="flex-1 h-12 sm:h-13 font-bold text-sm sm:text-base rounded-xl"
                onClick={() => setModalOpen(true)}
              >
                Get Floor Plans & Pricing
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <p className="text-[10px] sm:text-xs text-muted-foreground text-center sm:text-left max-w-[220px] mx-auto sm:mx-0 leading-relaxed">
                Sent instantly to your email. <br className="hidden sm:block" />
                No spam — just project info.
              </p>
            </div>
          </div>
        </div>
      </section>

      <FloorPlanModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        projectId={projectId}
        projectName={projectName}
        status={status}
        brochureUrl={brochureUrl}
      />
    </>
  );
}
