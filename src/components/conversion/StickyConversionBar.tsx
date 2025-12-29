import { useState, useEffect } from "react";
import { Download, Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccessPackModal } from "./AccessPackModal";

interface StickyConversionBarProps {
  projectId?: string;
  projectName?: string;
}

export function StickyConversionBar({ projectId, projectName }: StickyConversionBarProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalVariant, setModalVariant] = useState<"floorplans" | "fit_call">("floorplans");
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 300px
      setVisible(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const openFloorplans = () => {
    setModalVariant("floorplans");
    setModalOpen(true);
    
    // Track click
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "click_get_floorplans", {
        page_path: window.location.pathname,
        project_name: projectName || "general",
        source: "sticky_bar",
      });
    }
  };

  const openFitCall = () => {
    setModalVariant("fit_call");
    setModalOpen(true);
    
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "click_book_call", {
        page_path: window.location.pathname,
        project_name: projectName || "general",
        source: "sticky_bar",
      });
    }
  };

  if (dismissed || !visible) return null;

  return (
    <>
      {/* Mobile Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-background/95 backdrop-blur border-t border-border p-3 safe-area-pb">
        <div className="flex gap-2">
          <Button 
            onClick={openFloorplans}
            className="flex-1 h-12 font-semibold shadow-lg"
          >
            <Download className="h-4 w-4 mr-2" />
            Get Floorplans
          </Button>
          <Button 
            variant="outline" 
            onClick={openFitCall}
            className="h-12 px-4"
          >
            <Calendar className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Desktop Floating Bar */}
      <div className="hidden lg:block fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-background/95 backdrop-blur border border-border rounded-full shadow-2xl px-2 py-2 flex items-center gap-2">
          <Button 
            onClick={openFloorplans}
            className="h-11 px-6 font-semibold rounded-full"
          >
            <Download className="h-4 w-4 mr-2" />
            Get Floorplans + Pricing
          </Button>
          <Button 
            variant="outline" 
            onClick={openFitCall}
            className="h-11 px-6 rounded-full"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Book Fit Call
          </Button>
          <button 
            onClick={() => setDismissed(true)}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <AccessPackModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        projectId={projectId}
        projectName={projectName}
        variant={modalVariant}
        source="sticky_bar"
      />
    </>
  );
}
