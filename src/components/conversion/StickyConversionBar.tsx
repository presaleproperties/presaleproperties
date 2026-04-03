import { useState, useEffect } from "react";
import { MessageCircle, Phone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccessPackModal } from "./AccessPackModal";
import { useAppSetting } from "@/hooks/useAppSetting";

interface StickyConversionBarProps {
  projectId?: string;
  projectName?: string;
}

export function StickyConversionBar({ projectId, projectName }: StickyConversionBarProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);
  const { data: whatsappSetting } = useAppSetting("whatsapp_number");
  const whatsappNumber = (whatsappSetting as string) || "16722581100";

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const whatsappMessage = projectName 
    ? `Hi! I'm interested in ${projectName}. Can you help me with more details?`
    : "Hi! I'm interested in learning about presale projects. Can you help me?";
  
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  const openChatNow = () => {
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "click_chat_now", {
        page_path: window.location.pathname,
        project_name: projectName || "general",
        source: "sticky_bar",
      });
    }
    window.open(whatsappLink, "_blank");
  };

  const openCallBack = () => {
    setModalOpen(true);
    
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "click_request_callback", {
        page_path: window.location.pathname,
        project_name: projectName || "general",
        source: "sticky_bar",
      });
    }
  };

  if (dismissed || !visible) return null;

  return (
    <>
      {/* Desktop Floating Bar Only - Premium glass morphism */}
      <div 
        className="hidden lg:block"
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
        }}
      >
        <div className="bg-background/95 backdrop-blur-lg border border-border/80 rounded-full shadow-premium px-2 py-2 flex items-center gap-2">
          <Button 
            onClick={openChatNow}
            className="h-11 px-6 font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Chat Now
          </Button>
          <Button 
            variant="outline" 
            onClick={openCallBack}
            className="h-11 px-6 rounded-full hover:bg-muted transition-all duration-200"
          >
            <Phone className="h-4 w-4 mr-2" />
            Request a Call Back
          </Button>
          <button 
            onClick={() => setDismissed(true)}
            className="p-2 hover:bg-muted rounded-full transition-all duration-200"
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
        variant="fit_call"
        source="sticky_bar"
      />
    </>
  );
}
