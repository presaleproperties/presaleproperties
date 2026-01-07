import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { X } from "lucide-react";
import { ProjectLeadForm } from "./ProjectLeadForm";

interface FloorPlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  status: "coming_soon" | "registering" | "active" | "sold_out";
  brochureUrl?: string | null;
}

export function FloorPlanModal({
  open,
  onOpenChange,
  projectId,
  projectName,
  status,
  brochureUrl,
}: FloorPlanModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-md p-0 overflow-hidden bg-card border-0 max-h-[80vh] overflow-y-auto rounded-2xl shadow-2xl [&>button]:hidden mx-3"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <VisuallyHidden>
          <DialogTitle>Get Floor Plans & Pricing for {projectName}</DialogTitle>
        </VisuallyHidden>
        
        {/* Close button - positioned in header area with high visibility */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-3 top-3 z-50 p-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        
        {/* Compact form wrapper */}
        <div className="[&>div]:border-0 [&>div]:shadow-none [&>div]:rounded-none [&>div>div:first-child]:py-3 [&>div>div:last-child]:p-4 [&>div>div:last-child]:pt-3">
          <ProjectLeadForm
            projectId={projectId}
            projectName={projectName}
            status={status}
            brochureUrl={brochureUrl}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
