import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
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
        className="w-[calc(100%-24px)] max-w-md p-0 overflow-hidden bg-card border-0 max-h-[min(600px,85vh)] overflow-y-auto rounded-2xl shadow-2xl [&>button]:hidden"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <VisuallyHidden>
          <DialogTitle>Get Floor Plans & Pricing for {projectName}</DialogTitle>
        </VisuallyHidden>
        
        {/* Compact styling for modal - preserves 16px input text to prevent iOS zoom */}
        <div className="
          [&>div]:border-0 
          [&>div]:shadow-none 
          [&>div]:rounded-none
          [&>div>div:first-child]:px-4
          [&>div>div:first-child]:py-3
          [&>div>div:last-child]:p-4
          [&>div>div:last-child]:pt-3
          [&_.space-y-3]:space-y-2
          [&_h3]:text-base
          [&_.h-11]:h-10
          [&_.h-12]:h-11
          [&_.h-10]:h-9
          [&_.rounded-2xl]:rounded-xl
          [&_.rounded-lg]:rounded-md
          [&_.gap-3]:gap-2
          [&_.gap-2]:gap-1.5
          [&_.pt-1]:pt-0.5
          [&_.text-\\[10px\\]]:text-[9px]
        ">
          <ProjectLeadForm
            projectId={projectId}
            projectName={projectName}
            status={status}
            brochureUrl={brochureUrl}
            onClose={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
