import { useState, useRef } from "react";
import { ArrowRight, Shield, CheckCircle2, Loader2, X, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getVisitorId, getSessionId } from "@/lib/tracking/identifiers";
import { getUtmDataForSubmission } from "@/hooks/useUtmTracking";
import { cn } from "@/lib/utils";
import { PhoneVerificationField } from "@/components/ui/PhoneVerificationField";
import { formatPhoneNumber } from "@/lib/formatPhone";
import { upsertProjectLead } from "@/lib/upsertProjectLead";
import { useLeadSubmission } from "@/hooks/useLeadSubmission";

interface DeckPriceGateProps {
  slug: string;
  projectName: string;
  projectId?: string | null;
  onUnlock: () => void;
  /** Called when user dismisses without unlocking */
  onClose?: () => void;
}

export function DeckPriceGate({ slug, projectName, projectId, onUnlock, onClose }: DeckPriceGateProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const triggerSendRef = useRef<((phone: string) => Promise<void>) | null>(null);
  const hasSentRef = useRef(false);
  const { submitLead } = useLeadSubmission();
  const { toast } = useToast();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim() || fullName.trim().length < 2) e.fullName = "Please enter your full name";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = "Please enter a valid email";
    if (!phone.trim() || phone.replace(/\D/g, "").length < 10) e.phone = "Please enter a valid phone number";
    return e;
  };

  const completeLead = async (verPhone: string) => {
    setSubmitting(true);
    try {
      const visitorId = getVisitorId();
      const sessionId = getSessionId();
      const utmData = getUtmDataForSubmission();

      const leadId = await upsertProjectLead({
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: verPhone,
        message: `Pitch Deck: ${projectName}`,
        persona: "buyer",
        form_type: "deck_gate",
        agent_status: "no",
        lead_source: "pitch_deck",
        project_id: projectId || null,
        visitor_id: visitorId,
        session_id: sessionId,
        drip_sequence: "buyer",
        last_drip_sent: 0,
        next_drip_at: new Date().toISOString(),
        utm_source: utmData.utm_source,
        utm_medium: utmData.utm_medium,
        utm_campaign: utmData.utm_campaign,
        utm_content: utmData.utm_content,
        utm_term: utmData.utm_term,
        referrer: utmData.referrer,
        landing_page: utmData.landing_page,
      });

      // Lead scoring & tracking enrichment
      submitLead({
        leadId,
        firstName: fullName.trim().split(" ")[0],
        lastName: fullName.trim().split(" ").slice(1).join(" "),
        email: email.trim().toLowerCase(),
        phone: verPhone,
        formType: "deck_gate",
        projectName,
        projectUrl: window.location.href,
        message: `Pitch Deck: ${projectName}`,
      });

      // Auto-response email (Template A/B based on buyer vs agent)
      supabase.functions.invoke("send-lead-autoresponse", { body: { leadId, projectId } }).catch(console.error);

      supabase.functions.invoke("send-whatsapp-notification", {
        body: { leadName: fullName.trim(), leadPhone: verPhone, leadEmail: email.trim().toLowerCase(), projectName, deckSlug: slug },
      }).catch(console.error);

      supabase.functions.invoke("trigger-workflow", {
        body: {
          event: "project_inquiry",
          data: { email: email.trim(), first_name: fullName.trim().split(" ")[0], last_name: fullName.trim().split(" ").slice(1).join(" "), project_name: projectName, project_id: projectId },
          meta: { source: "pitch_deck" },
        },
      }).catch(console.error);

      supabase.functions.invoke("meta-conversions-api", {
        body: {
          event_name: "Lead",
          email: email.trim(),
          phone: verPhone,
          first_name: fullName.trim().split(" ")[0],
          last_name: fullName.trim().split(" ").slice(1).join(" "),
          event_source_url: window.location.href,
          content_name: projectName,
          content_category: "buyer",
          client_user_agent: navigator.userAgent,
          fbc: document.cookie.match(/_fbc=([^;]+)/)?.[1],
          fbp: document.cookie.match(/_fbp=([^;]+)/)?.[1],
        },
      }).catch(console.error);

      localStorage.setItem(`deck_unlocked_${slug}`, "1");
      localStorage.setItem(`deck_lead_email_${slug}`, email.trim().toLowerCase());
      localStorage.setItem(`deck_lead_name_${slug}`, fullName.trim());
      localStorage.setItem("pp_form_submitted", "true");
      if (typeof window !== "undefined" && (window as any).gtag) (window as any).gtag("event", "deck_price_unlock", { project_name: projectName });
      if (typeof window !== "undefined" && (window as any).fbq) (window as any).fbq("track", "Lead", { content_name: projectName });

      onUnlock();
    } catch (err: any) {
      console.error("Price gate submit error:", err);
      toast({ title: "Submission failed", description: err?.message || "Please try again.", variant: "destructive" });
      setPendingSubmit(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerified = (verPhone: string) => {
    completeLead(verPhone);
  };

  const handleReady = ({ triggerSend }: { triggerSend: (phone: string) => Promise<void> }) => {
    triggerSendRef.current = triggerSend;
    if (pendingSubmit && !hasSentRef.current) {
      hasSentRef.current = true;
      triggerSend(phone);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    hasSentRef.current = false;
    setPendingSubmit(true);
  };

  return (
    /* Backdrop — taps outside closes */
    <div
      className="fixed inset-0 z-[9000] flex items-end sm:items-center justify-center bg-neutral-900/50 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Sheet — stop propagation so tapping inside doesn't close */}
      <div
        className="relative w-full sm:max-w-md sm:mx-4 animate-in slide-in-from-bottom duration-300 ease-out sm:slide-in-from-bottom-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle on mobile */}
        <div className="sm:hidden flex justify-center pt-2 pb-1 bg-card rounded-t-3xl">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>
        <div className="bg-card border border-border border-t-0 sm:border-t rounded-b-none rounded-t-none sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90dvh] overflow-y-auto">


          {/* Header bar */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Tag className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground leading-tight">Unlock Pricing</p>
                <p className="text-xs text-muted-foreground">{projectName}</p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Body */}
          <div className="px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-foreground">
                {pendingSubmit ? "Verify Your Phone" : "Get Instant Access to Pricing"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {pendingSubmit
                  ? "Enter the 6-digit code we just sent you"
                  : "Enter your info below to instantly reveal unit prices and the investment calculator."}
              </p>
            </div>

            {pendingSubmit ? (
              <div className="space-y-4">
                <PhoneVerificationField
                  autoTrigger
                  defaultPhone={phone}
                  onVerified={handleVerified}
                  onReady={handleReady}
                />
                {submitting && (
                  <div className="flex items-center justify-center gap-2 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Unlocking pricing…</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => { setPendingSubmit(false); hasSentRef.current = false; }}
                  className="w-full text-xs text-muted-foreground hover:text-foreground underline text-center"
                >
                  ← Go back and edit
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={cn(
                      "w-full h-11 px-4 rounded-xl border bg-background text-[16px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-colors",
                      errors.fullName ? "border-destructive" : "border-input"
                    )}
                    autoComplete="name"
                  />
                  {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName}</p>}
                </div>
                <div>
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={cn(
                      "w-full h-11 px-4 rounded-xl border bg-background text-[16px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-colors",
                      errors.email ? "border-destructive" : "border-input"
                    )}
                    autoComplete="email"
                    inputMode="email"
                  />
                  {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                </div>
                <div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="(604) 555-0123"
                    value={phone}
                    onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                    className={cn(
                      "w-full h-11 px-4 rounded-xl border bg-background text-[16px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-colors",
                      errors.phone ? "border-destructive" : "border-input"
                    )}
                    autoComplete="tel"
                  />
                  {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
                </div>
                <button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all mt-1"
                >
                  Reveal Pricing <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            )}

            <div className="flex items-center justify-center gap-1.5 mt-4">
              <Shield className="h-3.5 w-3.5 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground/50">Your info is private. No spam, ever.</p>
            </div>

            {!pendingSubmit && (
              <div className="mt-4 pt-4 border-t border-border/40 flex flex-wrap items-center justify-center gap-3">
                {["Unit Prices", "Price/SqFt", "ROI Calculator"].map((item) => (
                  <div key={item} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="text-xs text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
