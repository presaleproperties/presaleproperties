import { useState, useRef } from "react";
import { Lock, ArrowRight, Shield, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getVisitorId, getSessionId } from "@/lib/tracking/identifiers";
import { getUtmDataForSubmission } from "@/hooks/useUtmTracking";
import { cn } from "@/lib/utils";
import { PhoneVerificationField } from "@/components/ui/PhoneVerificationField";

interface DeckLeadGateProps {
  slug: string;
  projectName: string;
  projectId?: string | null;
  heroImageUrl?: string | null;
  onUnlock: () => void;
}

export function DeckLeadGate({ slug, projectName, projectId, heroImageUrl, onUnlock }: DeckLeadGateProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const triggerSendRef = useRef<((phone: string) => Promise<void>) | null>(null);
  const hasSentRef = useRef(false);
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
      const leadId = crypto.randomUUID();

      const { error } = await (supabase as any).from("project_leads").insert({
        id: leadId,
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

      if (error) throw error;

      supabase.functions.invoke("send-whatsapp-notification", {
        body: { leadName: fullName.trim(), leadPhone: verPhone, leadEmail: email.trim().toLowerCase(), projectName, deckSlug: slug },
      }).catch(console.error);

      // Send to Zapier via send-project-lead with the correct leadId
      supabase.functions.invoke("send-project-lead", { body: { leadId } }).catch(console.error);

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
      localStorage.setItem("pp_form_submitted", "true");
      if (typeof window !== "undefined" && (window as any).gtag) (window as any).gtag("event", "deck_lead_gate_unlock", { project_name: projectName });
      if (typeof window !== "undefined" && (window as any).fbq) (window as any).fbq("track", "Lead", { content_name: projectName });

      onUnlock();
    } catch (err: any) {
      console.error("Lead gate submit error:", err);
      toast({ title: "Submission failed", description: err?.message || "Please try again.", variant: "destructive" });
      setPendingSubmit(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerified = (verPhone: string) => {
    setVerifiedPhone(verPhone);
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
    <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-background/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
          {/* Hero strip */}
          <div
            className="relative h-32 bg-muted overflow-hidden"
            style={heroImageUrl ? {
              backgroundImage: `url(${heroImageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            } : undefined}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-foreground/50 to-foreground/80" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
              <div className="h-11 w-11 rounded-full bg-primary/90 flex items-center justify-center mb-2 shadow-lg">
                <Lock className="h-5 w-5 text-primary-foreground" />
              </div>
              <p className="text-white font-bold text-base leading-tight">{projectName}</p>
              <p className="text-white/70 text-xs mt-0.5">Floor Plans · Pricing · Investment Calculator</p>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            <div className="text-center mb-5">
              <h2 className="text-xl font-bold text-foreground">
                {pendingSubmit ? "Verify Your Phone" : "Unlock Exclusive Details"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {pendingSubmit
                  ? "Enter the 6-digit code we just sent you"
                  : "Enter your info for instant access to floor plans, pricing, and the investment calculator."}
              </p>
            </div>

            {pendingSubmit ? (
              /* OTP step */
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
                    <span className="text-sm text-muted-foreground">Unlocking your access…</span>
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
              /* Form step */
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={cn(
                      "w-full h-11 px-4 rounded-xl border bg-background text-[16px] sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-colors",
                      errors.fullName ? "border-destructive" : "border-input"
                    )}
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
                      "w-full h-11 px-4 rounded-xl border bg-background text-[16px] sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-colors",
                      errors.email ? "border-destructive" : "border-input"
                    )}
                  />
                  {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                </div>

                <div>
                  <input
                    type="tel"
                    inputMode="tel"
                    placeholder="Phone Number (e.g. 604-555-0123)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={cn(
                      "w-full h-11 px-4 rounded-xl border bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-colors text-[16px]",
                      errors.phone ? "border-destructive" : "border-input"
                    )}
                    autoComplete="tel"
                  />
                  {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
                </div>

                <button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors mt-1"
                >
                  Unlock Full Details <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            )}

            {/* Trust line */}
            <div className="flex items-center justify-center gap-1.5 mt-4">
              <Shield className="h-3.5 w-3.5 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground/50">Your info is private. No spam, ever.</p>
            </div>

            {!pendingSubmit && (
              <div className="mt-4 pt-4 border-t border-border/40 flex flex-wrap items-center justify-center gap-3">
                {["Floor Plans", "Pricing", "Calculator"].map((item) => (
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
