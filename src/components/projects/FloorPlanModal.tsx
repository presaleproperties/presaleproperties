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
        className="w-[calc(100%-24px)] max-w-md p-0 overflow-hidden bg-card border-0 max-h-[min(580px,85vh)] overflow-y-auto rounded-2xl shadow-2xl [&>button]:hidden"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <VisuallyHidden>
          <DialogTitle>Get Floor Plans & Pricing for {projectName}</DialogTitle>
        </VisuallyHidden>
        
        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-3 top-2.5 z-50 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        
        {/* Ultra-compact form for iPhone SE compatibility */}
        <div className="
          [&>div]:border-0 
          [&>div]:shadow-none 
          [&>div]:rounded-none
          [&>div>div:first-child]:px-4
          [&>div>div:first-child]:py-2.5
          [&>div>div:first-child_.mb-2]:mb-1
          [&>div>div:last-child]:p-3
          [&>div>div:last-child]:pt-2.5
          [&_input]:h-9
          [&_input]:text-sm
          [&_.space-y-3]:space-y-1.5
          [&_.space-y-4]:space-y-2
          [&_h3]:text-base
          [&_h3]:leading-tight
          [&_h3>span]:text-sm
          [&_.h-11]:h-8
          [&_.h-14]:h-11
          [&_.rounded-xl]:rounded-lg
          [&_.gap-2\\.5]:gap-1.5
          [&_.mb-2]:mb-1
          [&_.mb-1\\.5]:mb-1
          [&_.pt-2]:hidden
          [&_.mt-2]:mt-1.5
          [&_.text-xs]:text-[11px]
          [&_label.text-xs]:text-[11px]
        ">
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
