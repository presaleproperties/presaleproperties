import { useState } from "react";
import { Lock, ArrowRight, Shield, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getVisitorId, getSessionId } from "@/lib/tracking/identifiers";
import { getUtmDataForSubmission } from "@/hooks/useUtmTracking";
import { cn } from "@/lib/utils";

interface DeckLeadGateProps {
  slug: string;
  projectName: string;
  projectId?: string | null;
  heroImageUrl?: string | null;
  onUnlock: () => void;
}

export function DeckLeadGate({ slug, projectName, projectId, heroImageUrl, onUnlock }: DeckLeadGateProps) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isRealtor, setIsRealtor] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim() || fullName.trim().length < 2) e.fullName = "Please enter your full name";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = "Please enter a valid email";
    if (!phone.trim() || phone.trim().length < 7) e.phone = "Please enter a valid phone number";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);

    try {
      const visitorId = getVisitorId();
      const sessionId = getSessionId();
      const utmData = getUtmDataForSubmission();

      const { error } = await (supabase as any)
        .from("project_leads")
        .insert({
          name: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          message: `Pitch Deck: ${projectName}`,
          persona: isRealtor ? "realtor" : "buyer",
          agent_status: isRealtor ? "i_am_realtor" : "no",
          lead_source: "floor_plan_request",
          project_id: projectId || null,
          visitor_id: visitorId,
          session_id: sessionId,
          drip_sequence: isRealtor ? "realtor" : "buyer",
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

      // Trigger workflows non-blocking
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
          phone: phone.trim(),
          first_name: fullName.trim().split(" ")[0],
          last_name: fullName.trim().split(" ").slice(1).join(" "),
          event_source_url: window.location.href,
          content_name: projectName,
          content_category: isRealtor ? "realtor" : "buyer",
          client_user_agent: navigator.userAgent,
          fbc: document.cookie.match(/_fbc=([^;]+)/)?.[1],
          fbp: document.cookie.match(/_fbp=([^;]+)/)?.[1],
        },
      }).catch(console.error);

      // Persist unlock across sessions
      localStorage.setItem(`deck_unlocked_${slug}`, "1");
      localStorage.setItem("pp_form_submitted", "true");

      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "deck_lead_gate_unlock", {
          project_name: projectName,
          persona: isRealtor ? "realtor" : "buyer",
        });
      }
      if (typeof window !== "undefined" && (window as any).fbq) {
        (window as any).fbq("track", "Lead", { content_name: projectName });
      }

      onUnlock();
    } catch (err: any) {
      console.error("Lead gate submit error:", err);
      toast({ title: "Submission failed", description: err?.message || "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-background/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-md">

        {/* Card */}
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
              <h2 className="text-xl font-bold text-foreground">Unlock Exclusive Details</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Enter your info for instant access to floor plans, pricing, and the investment calculator.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Full Name */}
              <div>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={cn(
                    "w-full h-11 px-4 rounded-xl border bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-colors",
                    errors.fullName ? "border-destructive" : "border-input"
                  )}
                />
                {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName}</p>}
              </div>

              {/* Phone */}
              <div>
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={cn(
                    "w-full h-11 px-4 rounded-xl border bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-colors",
                    errors.phone ? "border-destructive" : "border-input"
                  )}
                />
                {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
              </div>

              {/* Email */}
              <div>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(
                    "w-full h-11 px-4 rounded-xl border bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-colors",
                    errors.email ? "border-destructive" : "border-input"
                  )}
                />
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
              </div>

              {/* Realtor checkbox */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none py-1">
                <input
                  type="checkbox"
                  checked={isRealtor}
                  onChange={(e) => setIsRealtor(e.target.checked)}
                  className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
                />
                <span className="text-sm text-muted-foreground">I'm a licensed Realtor</span>
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-1"
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
                ) : (
                  <>Unlock Full Details <ArrowRight className="h-4 w-4" /></>
                )}
              </button>
            </form>

            {/* Trust line */}
            <div className="flex items-center justify-center gap-1.5 mt-4">
              <Shield className="h-3.5 w-3.5 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground/50">Your info is private. No spam, ever.</p>
            </div>

            {/* Social proof */}
            <div className="mt-4 pt-4 border-t border-border/40 flex flex-wrap items-center justify-center gap-3">
              {["Floor Plans", "Pricing", "Calculator"].map((item) => (
                <div key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-xs text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
