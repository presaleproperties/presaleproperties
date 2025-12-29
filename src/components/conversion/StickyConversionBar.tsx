import { useState, useEffect } from "react";
import { MessageCircle, Phone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccessPackModal } from "./AccessPackModal";
import { supabase } from "@/integrations/supabase/client";

interface StickyConversionBarProps {
  projectId?: string;
  projectName?: string;
}

export function StickyConversionBar({ projectId, projectName }: StickyConversionBarProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState<string>("16722581100");

  useEffect(() => {
    const fetchWhatsapp = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "whatsapp_number")
        .maybeSingle();
      if (data?.value) setWhatsappNumber(data.value as string);
    };
    fetchWhatsapp();
  }, []);

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
      {/* Desktop Floating Bar Only */}
      <div className="hidden lg:block fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-background/95 backdrop-blur border border-border rounded-full shadow-2xl px-2 py-2 flex items-center gap-2">
          <Button 
            onClick={openChatNow}
            className="h-11 px-6 font-semibold rounded-full"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Chat Now
          </Button>
          <Button 
            variant="outline" 
            onClick={openCallBack}
            className="h-11 px-6 rounded-full"
          >
            <Phone className="h-4 w-4 mr-2" />
            Request a Call Back
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
        variant="fit_call"
        source="sticky_bar"
      />
    </>
  );
}
