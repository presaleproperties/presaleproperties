import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackOffMarketEvent, setApprovedEmail } from "@/lib/offMarketAnalytics";
import { Lock, CheckCircle, Loader2 } from "lucide-react";

interface UnlockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingId: string;
  projectName: string;
  autoApprove: boolean;
  onApproved?: () => void;
}

const formatPhone = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  const clean = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (clean.length <= 3) return clean;
  if (clean.length <= 6) return `(${clean.slice(0, 3)}) ${clean.slice(3)}`;
  return `(${clean.slice(0, 3)}) ${clean.slice(3, 6)}-${clean.slice(6, 10)}`;
};

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

function UnlockForm({
  listingId, projectName, autoApprove, onApproved, onOpenChange,
}: Omit<UnlockModalProps, "open">) {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    hasAgent: "no", budget: "", timeline: "", message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email || !form.phone) return;

    setSubmitting(true);
    try {
      const status = autoApprove ? "approved" : "pending";

      const { error } = await supabase.from("off_market_access").insert({
        listing_id: listingId,
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        phone: form.phone,
        has_agent: form.hasAgent === "yes",
        budget_range: form.budget || null,
        timeline: form.timeline || null,
        message: form.message || null,
        status,
        approved_at: autoApprove ? new Date().toISOString() : null,
        approved_by: autoApprove ? "auto" : null,
        source: "off_market_page",
      } as any);

      if (error) throw error;

      await supabase.from("project_leads").insert({
        name: `${form.firstName} ${form.lastName}`,
        email: form.email,
        phone: form.phone,
        lead_source: "off_market",
        message: `Off-market inquiry: ${projectName}. Budget: ${form.budget || "N/A"}. Timeline: ${form.timeline || "N/A"}. Has agent: ${form.hasAgent}`,
      } as any).then(() => {});

      trackOffMarketEvent("unlock_request", listingId);

      // Notification is now handled by database trigger → notifications_queue
      
      if (autoApprove) {
        setApprovedEmail(form.email);
        toast.success("Access granted! Loading exclusive details...");
        onApproved?.();
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center py-8 text-center gap-4 px-4">
        <CheckCircle className="h-16 w-16 text-primary" />
        <h3 className="text-xl font-bold">Thank you, {form.firstName}!</h3>
        <p className="text-muted-foreground">
          Our team will review your request and get back to you within 24 hours. Check your email for updates.
        </p>
        <Button onClick={() => onOpenChange(false)} className="mt-4">Close</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 px-1">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>First Name *</Label>
          <Input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="bg-background/50 border-border h-11" />
        </div>
        <div>
          <Label>Last Name *</Label>
          <Input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="bg-background/50 border-border h-11" />
        </div>
      </div>
      <div>
        <Label>Email *</Label>
        <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-background/50 border-border h-11" />
      </div>
      <div>
        <Label>Phone *</Label>
        <Input required inputMode="numeric" value={form.phone} onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })} placeholder="(604) 555-1234" className="bg-background/50 border-border h-11" />
      </div>
      <div>
        <Label>Are you currently working with a realtor?</Label>
        <RadioGroup value={form.hasAgent} onValueChange={(v) => setForm({ ...form, hasAgent: v })} className="flex gap-4 mt-1">
          <div className="flex items-center gap-2"><RadioGroupItem value="yes" id="agent-yes" /><Label htmlFor="agent-yes">Yes</Label></div>
          <div className="flex items-center gap-2"><RadioGroupItem value="no" id="agent-no" /><Label htmlFor="agent-no">No</Label></div>
        </RadioGroup>
      </div>
      <div>
        <Label>Budget Range</Label>
        <Select value={form.budget} onValueChange={(v) => setForm({ ...form, budget: v })}>
          <SelectTrigger className="bg-background/50 border-border h-11"><SelectValue placeholder="Select budget" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Under $400K">Under $400K</SelectItem>
            <SelectItem value="$400K-$500K">$400K - $500K</SelectItem>
            <SelectItem value="$500K-$750K">$500K - $750K</SelectItem>
            <SelectItem value="$750K-$1M">$750K - $1M</SelectItem>
            <SelectItem value="$1M-$1.5M">$1M - $1.5M</SelectItem>
            <SelectItem value="$1.5M+">$1.5M+</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Timeline</Label>
        <Select value={form.timeline} onValueChange={(v) => setForm({ ...form, timeline: v })}>
          <SelectTrigger className="bg-background/50 border-border h-11"><SelectValue placeholder="Select timeline" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Ready now">Ready now</SelectItem>
            <SelectItem value="3-6 months">3-6 months</SelectItem>
            <SelectItem value="6-12 months">6-12 months</SelectItem>
            <SelectItem value="Just exploring">Just exploring</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Message (optional)</Label>
        <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Any specific requirements or questions?" className="bg-background/50 border-border" rows={3} />
      </div>
      <Button type="submit" className="w-full h-12 text-base" disabled={submitting}>
        {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</> : "Get VIP Access"}
      </Button>
      <p className="text-xs text-muted-foreground text-center pb-2">
        Your information is kept private. Our team will review your request.
      </p>
    </form>
  );
}

export function UnlockModal(props: UnlockModalProps) {
  const { open, onOpenChange, projectName } = props;
  const isMobile = useIsMobile();

  const header = (
    <div className="flex items-center gap-2 text-lg font-semibold">
      <Lock className="h-5 w-5 text-primary" />
      Unlock exclusive details for {projectName}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[95vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>{header}</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-safe">
            <UnlockForm {...props} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{header}</DialogTitle>
        </DialogHeader>
        <UnlockForm {...props} />
      </DialogContent>
    </Dialog>
  );
}
