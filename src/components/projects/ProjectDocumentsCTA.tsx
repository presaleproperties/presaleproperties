import { useState } from "react";
import { FileText, LayoutGrid, DollarSign, ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FloorPlanModal } from "./FloorPlanModal";

interface ProjectDocumentsCTAProps {
  projectId: string;
  projectName: string;
  status: "coming_soon" | "registering" | "active" | "sold_out";
  brochureUrl?: string | null;
  floorplanUrl?: string | null;
  pricingUrl?: string | null;
}

export function ProjectDocumentsCTA({
  projectId,
  projectName,
  status,
  brochureUrl,
  floorplanUrl,
  pricingUrl,
}: ProjectDocumentsCTAProps) {
  const [modalOpen, setModalOpen] = useState(false);

  // Determine what documents are available
  const hasAnyDocs = brochureUrl || floorplanUrl || pricingUrl;

  const documents = [
    { label: "Floor Plans", icon: LayoutGrid, available: !!floorplanUrl },
    { label: "Brochure", icon: FileText, available: !!brochureUrl },
    { label: "Pricing Sheet", icon: DollarSign, available: !!pricingUrl },
  ].filter((d) => d.available);

  // If no documents at all, show a generic CTA
  if (!hasAnyDocs) {
    return (
      <>
        <section className="bg-foreground text-background rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-lg sm:text-xl font-bold mb-1.5">
                Interested in {projectName}?
              </h3>
              <p className="text-background/70 text-sm sm:text-base">
                Get pricing details, floor plans, and VIP access to this project.
              </p>
            </div>
            <Button
              size="lg"
              className="w-full sm:w-auto h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shrink-0"
              onClick={() => setModalOpen(true)}
            >
              Get VIP Access
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
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

  return (
    <>
      <section className="bg-foreground text-background rounded-xl sm:rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 md:p-8">
          <div className="flex flex-col gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-2 block">
                Exclusive Documents
              </span>
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-1.5">
                Get {projectName} Floor Plans & Pricing
              </h3>
              <p className="text-background/70 text-sm sm:text-base max-w-lg">
                Access detailed floor plans, brochures, and pricing information. Submit your details to unlock all project documents.
              </p>
            </div>

            {/* Document pills */}
            <div className="flex flex-wrap gap-2">
              {documents.map(({ label, icon: Icon }) => (
                <div
                  key={label}
                  className="inline-flex items-center gap-1.5 bg-background/10 border border-background/20 rounded-full px-3 py-1.5 text-sm"
                >
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  <span className="text-background/90">{label}</span>
                  <Lock className="h-3 w-3 text-background/40" />
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <Button
              size="lg"
              className="w-full sm:w-auto h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
              onClick={() => setModalOpen(true)}
            >
              Unlock Floor Plans & Pricing
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
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
