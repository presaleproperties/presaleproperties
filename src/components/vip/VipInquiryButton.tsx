import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useVipAuth } from "@/hooks/useVipAuth";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Loader2, CheckCircle2, Send } from "lucide-react";
import { toast } from "sonner";

interface VipInquiryButtonProps {
  listingId: string;
  unitId?: string;
  unitName?: string;
  projectName?: string;
  className?: string;
  variant?: "default" | "card" | "modal";
}

export function VipInquiryButton({
  listingId,
  unitId,
  unitName,
  projectName,
  className,
  variant = "default",
}: VipInquiryButtonProps) {
  const { vipUser, isVipLoggedIn } = useVipAuth();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isVipLoggedIn) return null;

  const handleSubmit = async () => {
    if (!vipUser) return;
    setLoading(true);

    const meta = vipUser.user_metadata || {};
    const buyerName = [meta.first_name, meta.last_name].filter(Boolean).join(" ") || vipUser.email || "VIP Buyer";

    const { error } = await (supabase as any).from("off_market_inquiries").insert({
      listing_id: listingId,
      unit_id: unitId || null,
      user_id: vipUser.id,
      buyer_name: buyerName,
      buyer_email: vipUser.email || "",
      buyer_phone: meta.phone || null,
      message: message.trim() || null,
      unit_name: unitName || null,
      project_name: projectName || null,
    });

    if (error) {
      toast.error("Failed to submit interest. Please try again.");
      console.error(error);
    } else {
      setSubmitted(true);
      toast.success("Interest submitted! We'll be in touch shortly.");
    }
    setLoading(false);
  };

  if (submitted) {
    return (
      <Button
        disabled
        className={`gap-2 ${className}`}
        variant="outline"
      >
        <CheckCircle2 className="h-4 w-4 text-primary" />
        Interest Submitted
      </Button>
    );
  }

  if (variant === "card") {
    return (
      <>
        <Button
          size="sm"
          variant="outline"
          className={`gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10 ${className}`}
          onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        >
          <Heart className="h-3 w-3" />
          I'm Interested
        </Button>
        <InquiryDialog
          open={open}
          onOpenChange={setOpen}
          unitName={unitName}
          projectName={projectName}
          message={message}
          setMessage={setMessage}
          loading={loading}
          onSubmit={handleSubmit}
        />
      </>
    );
  }

  if (variant === "modal") {
    return (
      <>
        <Button
          className={`gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/25 ${className}`}
          onClick={() => setOpen(true)}
        >
          <Heart className="h-4 w-4" />
          I'm Interested
        </Button>
        <InquiryDialog
          open={open}
          onOpenChange={setOpen}
          unitName={unitName}
          projectName={projectName}
          message={message}
          setMessage={setMessage}
          loading={loading}
          onSubmit={handleSubmit}
        />
      </>
    );
  }

  return (
    <>
      <Button
        className={`gap-2 ${className}`}
        onClick={() => setOpen(true)}
      >
        <Heart className="h-4 w-4" />
        I'm Interested
      </Button>
      <InquiryDialog
        open={open}
        onOpenChange={setOpen}
        unitName={unitName}
        projectName={projectName}
        message={message}
        setMessage={setMessage}
        loading={loading}
        onSubmit={handleSubmit}
      />
    </>
  );
}

function InquiryDialog({
  open,
  onOpenChange,
  unitName,
  projectName,
  message,
  setMessage,
  loading,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  unitName?: string;
  projectName?: string;
  message: string;
  setMessage: (v: string) => void;
  loading: boolean;
  onSubmit: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Express Interest
          </DialogTitle>
          <DialogDescription>
            {unitName
              ? `Let us know you're interested in ${unitName}${projectName ? ` at ${projectName}` : ""}.`
              : `Let us know you're interested${projectName ? ` in ${projectName}` : ""}.`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="inquiry-message">Message (optional)</Label>
            <Textarea
              id="inquiry-message"
              placeholder="Any questions or specific requirements? E.g., preferred floor, move-in timeline..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={1000}
            />
          </div>
          <Button
            className="w-full gap-2"
            onClick={onSubmit}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Submit Interest
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Our team will reach out to you within 24 hours.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
