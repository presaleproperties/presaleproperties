import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { upsertProjectLead } from "@/lib/upsertProjectLead";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  projectName: string;
  agentEmail?: string;
}

export function BookingModal({ open, onClose, projectName, agentEmail }: BookingModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !email) return;
    setLoading(true);
    try {
      await upsertProjectLead({
        name,
        phone,
        email,
        message,
        form_type: "deck_booking",
        lead_source: "pitch_deck_booking",
        landing_page: window.location.href,
      });
      setDone(true);
      setTimeout(() => {
        onClose();
        setDone(false);
        setName(""); setPhone(""); setEmail(""); setMessage("");
      }, 2500);
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Book a Private Showing</DialogTitle>
        </DialogHeader>

        {done ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
            <p className="font-semibold text-foreground">Request Received!</p>
            <p className="text-sm text-muted-foreground">
              We'll be in touch within 24 hours to confirm your showing for {projectName}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="booking-name">Full Name *</Label>
              <Input
                id="booking-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="booking-phone">Phone *</Label>
              <Input
                id="booking-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (604) 555-0100"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="booking-email">Email *</Label>
              <Input
                id="booking-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="booking-msg">Message (optional)</Label>
              <Textarea
                id="booking-msg"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Any questions or preferred showing times?"
                className="min-h-[80px]"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {loading ? "Submitting..." : "Request Showing"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              No obligation. Your information is kept private.
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
