import { Phone, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProjectMobileCTAProps {
  projectName: string;
  status: "coming_soon" | "active" | "sold_out";
  onRegisterClick: () => void;
}

export function ProjectMobileCTA({ projectName, status, onRegisterClick }: ProjectMobileCTAProps) {
  const getButtonText = () => {
    switch (status) {
      case "coming_soon":
        return "Register Now";
      case "active":
        return "Get Pricing";
      default:
        return "Join Waitlist";
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-background/95 backdrop-blur-md border-t border-border shadow-lg">
      <div className="container px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground truncate">{projectName}</p>
            <p className="text-sm font-semibold text-foreground">
              {status === "coming_soon" ? "Coming Soon" : status === "active" ? "Now Selling" : "Sold Out"}
            </p>
          </div>
          <Button 
            variant="outline" 
            size="icon"
            className="shrink-0 h-11 w-11"
            asChild
          >
            <a href="tel:+16722581100">
              <Phone className="h-5 w-5" />
            </a>
          </Button>
          <Button 
            size="lg"
            className="shrink-0 h-11 px-5 font-semibold"
            onClick={onRegisterClick}
          >
            <Send className="h-4 w-4 mr-2" />
            {getButtonText()}
          </Button>
        </div>
      </div>
    </div>
  );
}
