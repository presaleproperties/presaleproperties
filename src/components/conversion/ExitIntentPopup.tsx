import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Download, Shield, CheckCircle, AlertTriangle, FileText, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { upsertProjectLead } from "@/lib/upsertProjectLead";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { getVisitorId, getSessionId, trackFormStart, trackFormSubmit } from "@/lib/tracking";
import { MetaEvents } from "@/components/tracking/MetaPixel";
import { useLeadSubmission } from "@/hooks/useLeadSubmission";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Please enter a valid email").max(255),
});

type FormData = z.infer<typeof schema>;

const MISTAKES = [
  { icon: "⚠️", text: "Hidden contract clauses that cost buyers $50K+" },
  { icon: "🔍", text: "Developer red flags most buyers overlook" },
  { icon: "📋", text: "Deposit traps & assignment restriction risks" },
  { icon: "💰", text: "GST, PTT & closing costs nobody warns you about" },
  { icon: "🏗️", text: "Completion delay loopholes developers use" },
  { icon: "📝", text: "What the sales centre won't tell you" },
  { icon: "🤝", text: "Why you need YOUR own agent — not theirs" },
];

export function ExitIntentPopup() {
  const location = useLocation();
  const pathname = location.pathname;

  // Suppress on admin, agent, developer portals, login, and for-agents pages
  const isPortalRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/agent") ||
    pathname.startsWith("/developer") ||
    pathname.startsWith("/for-agents") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup");

  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const { submitLead } = useLeadSubmission();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "" },
  });

  // Fetch configured PDF URL from app_settings
  useEffect(() => {
    supabase
      .from("app_settings")
      .select("value")
      .eq("key", "exit_intent_pdf_url")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) setPdfUrl(String(data.value).replace(/^"|"$/g, ""));
      });
  }, []);

  useEffect(() => {
    const hasShown = sessionStorage.getItem("exit_intent_shown");
    const hasConverted = localStorage.getItem("presale_lead_converted");
    const hasSubmittedAnyForm = localStorage.getItem("pp_form_submitted");
    const hasBooking = localStorage.getItem("pp_booking_submitted");

    if (hasShown || hasConverted || hasSubmittedAnyForm || hasBooking || isPortalRoute) return;

    const isConsumerPage =
      pathname === "/" ||
      pathname.startsWith("/presale-projects") ||
      pathname.endsWith("-presale-condos") ||
      pathname.endsWith("-presale-townhomes") ||
      pathname.startsWith("/resale") ||
      pathname.startsWith("/blog") ||
      pathname.startsWith("/guides") ||
      pathname === "/calculator" ||
      pathname === "/mortgage-calculator";

    if (!isConsumerPage) return;

    let timeout: NodeJS.Timeout;
    let mobileTimeout: NodeJS.Timeout;

    const triggerPopup = () => {
      if (sessionStorage.getItem("exit_intent_shown")) return;
      setOpen(true);
      sessionStorage.setItem("exit_intent_shown", "true");
      MetaEvents.formStart({ content_name: "Exit Intent Guide", content_category: "lead_magnet" });
      trackFormStart({ form_name: "exit_intent_guide", form_location: "exit_popup" });
    };

    const isMobile = window.innerWidth < 768 || "ontouchstart" in window;

    if (isMobile) {
      let maxScrollY = 0;
      let scrolledDown = false;
      const handleMobileScroll = () => {
        const scrollPct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
        if (scrollPct > 0.4) { scrolledDown = true; maxScrollY = Math.max(maxScrollY, window.scrollY); }
        if (scrolledDown && maxScrollY > 200 && window.scrollY < maxScrollY * 0.3) {
          window.removeEventListener("scroll", handleMobileScroll);
          triggerPopup();
        }
      };
      mobileTimeout = setTimeout(() => {
        window.addEventListener("scroll", handleMobileScroll, { passive: true });
      }, 12000);
    } else {
      const handleMouseLeave = (e: MouseEvent) => {
        if (e.clientY <= 5 && e.relatedTarget === null) {
          timeout = setTimeout(triggerPopup, 100);
        }
      };
      const addListener = setTimeout(() => {
        document.addEventListener("mouseleave", handleMouseLeave);
      }, 12000);
      return () => {
        clearTimeout(addListener);
        clearTimeout(timeout);
        document.removeEventListener("mouseleave", handleMouseLeave);
      };
    }

    return () => {
      clearTimeout(mobileTimeout);
      clearTimeout(timeout);
    };
  }, [pathname, isPortalRoute]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const visitorId = getVisitorId();
      const sessionId = getSessionId();
      const utmSource = sessionStorage.getItem("utm_source") || null;
      const utmMedium = sessionStorage.getItem("utm_medium") || null;
      const utmCampaign = sessionStorage.getItem("utm_campaign") || null;
      const referrer = sessionStorage.getItem("referrer") || document.referrer || null;
      const landingPage = sessionStorage.getItem("landing_page") || window.location.href;

      const firstName = data.name.trim().split(" ")[0];

      const { error } = await supabase.from("newsletter_subscribers").insert({
        email: data.email,
        source: "exit_intent_guide",
        preferred_city: null,
        wants_projects: true,
        wants_assignments: false,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        referrer,
        landing_page: landingPage,
      });

      if (error && !error.message.includes("duplicate")) throw error;

      const leadId = await upsertProjectLead({
        name: data.name.trim(),
        email: data.email.trim(),
        form_type: "exit_intent",
        message: "7 Mistakes Guide - Exit Intent Download",
        lead_source: "exit_intent_guide",
        visitor_id: visitorId,
        session_id: sessionId,
        landing_page: landingPage,
        referrer,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
      });

      submitLead({
        leadId,
        firstName,
        lastName: "",
        email: data.email.trim(),
        phone: "",
        formType: "exit_intent",
        message: "7 Mistakes Guide - Exit Intent Download",
        projectUrl: window.location.href,
      });

      // Auto-response email (will skip gracefully if no project_id)
      supabase.functions.invoke("send-lead-autoresponse", { body: { leadId } }).catch(console.error);

      trackFormSubmit({ form_name: "exit_intent_guide", form_location: "exit_popup", email: data.email });

      MetaEvents.lead({ content_name: "Exit Intent Guide", content_category: "lead_magnet" });

      supabase.functions.invoke("meta-conversions-api", {
        body: {
          event_name: "Lead",
          email: data.email,
          event_source_url: window.location.href,
          content_name: "7 Mistakes Guide",
          content_category: "lead_magnet",
          client_user_agent: navigator.userAgent,
          fbc: document.cookie.match(/_fbc=([^;]+)/)?.[1],
          fbp: document.cookie.match(/_fbp=([^;]+)/)?.[1],
        },
      }).catch(console.error);

      localStorage.setItem("presale_lead_converted", "true");
      localStorage.setItem("pp_form_submitted", "true");
      setIsSubmitted(true);
    } catch (error: any) {
      console.error("Error:", error);
      toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 overflow-hidden border-0 shadow-2xl w-[calc(100%-2rem)] max-w-[520px] rounded-2xl max-h-[90vh] overflow-y-auto">
        <VisuallyHidden>
          <DialogTitle>Get Free Presale Mistakes Guide</DialogTitle>
        </VisuallyHidden>

        {!isSubmitted ? (
          <div className="flex flex-col">
            {/* ── Top panel ── */}
            <div className="relative bg-foreground overflow-hidden px-6 pt-7 pb-6">
              {/* Subtle glow */}
              <div className="absolute -top-16 -right-16 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 bg-primary/15 border border-primary/30 rounded-full px-3 py-1 mb-4">
                <AlertTriangle className="h-3 w-3 text-primary" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">Free Guide</span>
              </div>

              <h2 className="text-[22px] sm:text-2xl font-extrabold text-background leading-[1.2] mb-2">
                7 Costly Mistakes<br />
                <span className="text-primary">Presale Buyers Make</span>
              </h2>
              <p className="text-background/60 text-sm leading-relaxed">
                Most buyers don't find out until it's too late. This guide tells you exactly what to watch for before you sign anything.
              </p>
            </div>

            {/* ── Mistakes list ── */}
            <div className="bg-muted/40 border-b border-border px-6 py-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">What's inside</p>
              <div className="grid grid-cols-1 gap-1.5">
                {MISTAKES.map((m, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <span className="text-sm leading-none">{m.icon}</span>
                    <span className="text-xs text-foreground/80 leading-tight">{m.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Form ── */}
            <div className="px-6 py-5 bg-background">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                <Input
                  type="text"
                  placeholder="First Name"
                  autoComplete="given-name"
                  {...form.register("name")}
                  className="h-11"
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive -mt-1">{form.formState.errors.name.message}</p>
                )}
                <Input
                  type="email"
                  placeholder="Email Address"
                  autoComplete="email"
                  {...form.register("email")}
                  className="h-11"
                />
                {form.formState.errors.email && (
                  <p className="text-xs text-destructive -mt-1">{form.formState.errors.email.message}</p>
                )}
                <Button
                  type="submit"
                  className="w-full h-11 font-bold text-sm gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending…" : (
                    <>
                      Send Me the Free Guide
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-3 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                <Shield className="h-3 w-3 shrink-0" />
                <span>No spam. Unsubscribe anytime. 100% free.</span>
              </div>
            </div>
          </div>
        ) : (
          /* ── Success State ── */
          <div className="flex flex-col">
            {/* Header */}
            <div className="bg-foreground px-6 pt-7 pb-6 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
              <div className="relative">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/15 rounded-full mb-3">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-extrabold text-background mb-1">You're All Set! 🎉</h2>
                <p className="text-background/60 text-sm">
                  Check your inbox — the guide is on its way.
                </p>
              </div>
            </div>

            {/* PDF Preview / Download */}
            <div className="px-6 py-5 bg-background">
              {pdfUrl ? (
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-foreground text-center">Or download it right now:</p>

                  {/* PDF Preview embed */}
                  <div className="rounded-xl overflow-hidden border border-border shadow-sm bg-muted" style={{ height: 260 }}>
                    <iframe
                      src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                      className="w-full h-full"
                      title="7 Mistakes Guide Preview"
                    />
                  </div>

                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="flex items-center justify-center gap-2 w-full h-11 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download PDF Guide
                  </a>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-muted rounded-xl">
                    <FileText className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your guide will arrive in your inbox shortly. While you wait, explore our latest presale projects.
                  </p>
                  <Button className="w-full" onClick={() => setOpen(false)}>
                    Continue Browsing
                  </Button>
                </div>
              )}

              <button
                onClick={() => setOpen(false)}
                className="mt-3 w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
