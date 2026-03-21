import { Phone, MessageCircle, Download, X, ChevronDown, CheckCircle, Lock, FileText, LayoutGrid, DollarSign, ExternalLink, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PhoneVerificationField } from "@/components/ui/PhoneVerificationField";
import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { MetaEvents } from "@/components/tracking/MetaPixel";
import { getUtmDataForSubmission } from "@/hooks/useUtmTracking";
import { trackCTAClick } from "@/hooks/useLoftyTracking";
import { trackFormStart, trackFormSubmit, getVisitorId, getSessionId } from "@/lib/tracking";
import { getIntentScore, getCityInterests, getTopViewedProjects } from "@/lib/tracking/intentScoring";

const phoneRegex = /^[\+]?[1]?[-.\s]?[(]?[0-9]{3}[)]?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/;

const formSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").max(100),
  email: z.string().trim().email("Please enter a valid email").max(255),
  phone: z.string().trim().min(1, "Phone number is required").regex(phoneRegex, "Please enter a valid phone number"),
  workingWithAgent: z.boolean().default(false),
  isRealtor: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

const isGoogleDriveLink = (url: string) =>
  url.includes("drive.google.com") || url.includes("docs.google.com");

const hasValidUrl = (url: string | null | undefined): url is string =>
  Boolean(url && url.trim().length > 0);

interface ProjectMobileCTAProps {
  projectName: string;
  projectId?: string;
  status: "coming_soon" | "registering" | "active" | "sold_out";
  startingPrice?: number | null;
  brochureUrl?: string | null;
  floorplanUrl?: string | null;
  pricingUrl?: string | null;
  onRegisterClick: () => void;
}

export function ProjectMobileCTA({
  projectName,
  projectId,
  status,
  startingPrice,
  brochureUrl,
  floorplanUrl,
  pricingUrl,
  onRegisterClick,
}: ProjectMobileCTAProps) {
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);
  const [pendingData, setPendingData] = useState<FormData | null>(null);
  const triggerSendRef = useRef<((phone: string) => Promise<void>) | null>(null);

  const hasBrochure = hasValidUrl(brochureUrl);
  const hasFloorplan = hasValidUrl(floorplanUrl);
  const hasPricing = hasValidUrl(pricingUrl);
  const hasAnyDocuments = hasBrochure || hasFloorplan || hasPricing;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { fullName: "", email: "", phone: "", workingWithAgent: false, isRealtor: false },
  });

  useEffect(() => {
    supabase.from("app_settings").select("value").eq("key", "whatsapp_number").maybeSingle()
      .then(({ data }) => { if (data?.value) setWhatsappNumber(String(data.value).replace(/"/g, "")); });
  }, []);

  useEffect(() => {
    if (isExpanded) {
      MetaEvents.formStart({ content_name: projectName, content_category: "floorplans" });
      trackFormStart({ form_name: "floor_plan_request", form_location: "mobile_cta_footer" });
    }
    if (!isExpanded && !submitted) {
      form.reset();
      setPendingData(null);
      setVerifiedPhone(null);
    }
  }, [isExpanded]);

  useEffect(() => {
    const handleGalleryCTA = () => setIsExpanded(true);
    const handleGalleryOpen = () => setIsHidden(true);
    const handleGalleryClose = () => setIsHidden(false);
    window.addEventListener("presale-gallery-cta", handleGalleryCTA);
    window.addEventListener("gallery-opened", handleGalleryOpen);
    window.addEventListener("gallery-closed", handleGalleryClose);
    return () => {
      window.removeEventListener("presale-gallery-cta", handleGalleryCTA);
      window.removeEventListener("gallery-opened", handleGalleryOpen);
      window.removeEventListener("gallery-closed", handleGalleryClose);
    };
  }, []);

  const completeLead = async (phone: string, data: FormData) => {
    setIsSubmitting(true);
    try {
      const leadId = crypto.randomUUID();
      const utmData = getUtmDataForSubmission();
      const visitorId = getVisitorId();
      const sessionId = getSessionId();
      const intentScore = getIntentScore();
      const cityInterest = getCityInterests();
      const projectInterest = getTopViewedProjects().map((p) => p.project_id);
      const actualPersona = data.isRealtor ? "realtor" : "buyer";

      const { error } = await supabase.from("project_leads").insert({
        id: leadId,
        project_id: projectId || null,
        name: data.fullName,
        email: data.email,
        phone,
        persona: actualPersona,
        agent_status: data.workingWithAgent ? "working_with_agent" : data.isRealtor ? "i_am_realtor" : "no",
        message: [
          data.workingWithAgent ? "Working with agent" : null,
          data.isRealtor ? "Is a Realtor" : null,
        ].filter(Boolean).join(", ") || null,
        drip_sequence: "buyer",
        last_drip_sent: 0,
        next_drip_at: new Date().toISOString(),
        lead_source: "floor_plan_request",
        utm_source: utmData.utm_source,
        utm_medium: utmData.utm_medium,
        utm_campaign: utmData.utm_campaign,
        utm_content: utmData.utm_content,
        utm_term: utmData.utm_term,
        referrer: utmData.referrer,
        landing_page: utmData.landing_page,
        visitor_id: visitorId,
        session_id: sessionId,
        intent_score: intentScore,
        city_interest: cityInterest,
        project_interest: projectInterest,
      });

      if (error) throw error;

      trackCTAClick({ cta_type: "lead_form_submit", cta_label: "Get Instant Access", cta_location: "mobile_cta_footer", project_id: projectId, project_name: projectName });
      trackFormSubmit({ form_name: "floor_plan_request", form_location: "mobile_cta_footer", first_name: data.fullName, last_name: "", email: data.email, phone, user_type: actualPersona, project_id: projectId, project_name: projectName });

      supabase.functions.invoke("trigger-workflow", { body: { event: "project_inquiry", data: { email: data.email, first_name: data.fullName, last_name: "", project_name: projectName, project_id: projectId }, meta: { lead_id: leadId, source: "floor_plan_request" } } }).catch(console.error);
      supabase.functions.invoke("send-project-lead", { body: { leadId } }).catch(console.error);
      supabase.functions.invoke("meta-conversions-api", { body: { event_name: "Lead", email: data.email, phone, first_name: data.fullName, last_name: "", event_source_url: window.location.href, content_name: projectName, content_category: actualPersona, client_user_agent: navigator.userAgent, fbc: document.cookie.match(/_fbc=([^;]+)/)?.[1], fbp: document.cookie.match(/_fbp=([^;]+)/)?.[1] } }).catch(console.error);

      MetaEvents.lead({ content_name: projectName, content_category: actualPersona });

      localStorage.setItem("presale_persona", actualPersona);
      localStorage.setItem("pp_form_submitted", "true");
      localStorage.setItem("presale_lead_converted", "true");

      if (typeof window !== "undefined") {
        (window as any).gtag?.("event", "submit_access_pack", { page_path: window.location.pathname, project_name: projectName, persona: actualPersona, source: "mobile_cta_footer" });
        (window as any).fbq?.("track", "Lead", { content_name: projectName, content_category: actualPersona });
      }

      setSubmitted(true);
    } catch (err: any) {
      console.error("Lead form error:", err);
      form.setError("root", { message: "Something went wrong. Please try again." });
      setPendingData(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerified = (phone: string) => {
    setVerifiedPhone(phone);
    if (pendingData) {
      completeLead(phone, pendingData);
    }
  };

  const onSubmit = async (data: FormData) => {
    setPendingData(data);
    if (triggerSendRef.current) {
      await triggerSendRef.current(data.phone);
    }
  };

  const whatsappMsg = encodeURIComponent(`Hello! Can I get more details about "${projectName}"?`);
  const whatsappLink = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${whatsappMsg}` : null;

  const isAwaitingOTP = !!pendingData && !verifiedPhone;

  return (
    <>
      <div className="h-24 lg:hidden" aria-hidden="true" />

      <div
        className={`lg:hidden fixed inset-x-0 bottom-0 transition-transform duration-200 ${isHidden ? "translate-y-full" : "translate-y-0"}`}
        style={{ zIndex: 99999, isolation: "isolate", willChange: "transform", pointerEvents: "auto", width: "100%" }}
      >
        <div className={`bg-background border-t border-border transition-all duration-300 ease-out ${isExpanded ? "rounded-t-3xl shadow-[0_-16px_50px_rgba(0,0,0,0.3)]" : "shadow-[0_-8px_30px_rgba(0,0,0,0.2)]"}`}>

          {isExpanded && (
            <div className="overflow-y-auto overscroll-contain bg-background rounded-t-3xl" style={{ maxHeight: "calc(85vh - 70px)" }}>

              <div className="sticky top-0 bg-background z-10 rounded-t-3xl overflow-hidden">
                <div className="h-0.5 bg-gradient-to-r from-primary via-primary/70 to-transparent" />
                <div className="px-5 pt-4 pb-3 border-b border-border/40 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base tracking-tight">
                      {submitted ? "You're All Set!" : isAwaitingOTP ? "Verify Your Phone" : "Get Instant Access"}
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      {!submitted && <Lock className="h-3 w-3" />}
                      {submitted
                        ? "An email with full details will be sent to you shortly."
                        : isAwaitingOTP
                        ? "Enter the 6-digit code we just sent you"
                        : hasAnyDocuments ? "Floor plans & brochures · No obligation" : "An agent will contact you within 24 hrs"}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-muted -mr-1" onClick={() => setIsExpanded(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {submitted ? (
                <div className="p-5 space-y-4 pb-8">
                  <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/15 rounded-xl">
                    <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Check your inbox shortly</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Full details for <strong>{projectName}</strong> will be emailed to you. One of our agents will follow up within <strong>24 hours</strong>.
                      </p>
                    </div>
                  </div>
                  {whatsappLink && (
                    <Button asChild size="lg" className="w-full h-12 text-sm font-semibold rounded-xl bg-[#25D366] hover:bg-[#1ebe5a] text-white border-0">
                      <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="h-4 w-4 mr-2" />Chat Now on WhatsApp
                      </a>
                    </Button>
                  )}
                  <p className="text-center text-[11px] text-muted-foreground">
                    We're available 7 days a week to answer your questions.
                  </p>
                </div>
              ) : (
                <div className="p-5 pb-8">
                  {hasAnyDocuments && !isAwaitingOTP && (
                    <div className="flex items-center gap-1.5 flex-wrap mb-4">
                      {hasFloorplan && <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-wide text-primary bg-primary/10 px-2 py-0.5 rounded-md"><LayoutGrid className="h-2.5 w-2.5" /> Floor Plans</span>}
                      {hasPricing && <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-wide text-primary bg-primary/10 px-2 py-0.5 rounded-md"><DollarSign className="h-2.5 w-2.5" /> Pricing</span>}
                      {hasBrochure && <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-wide text-primary bg-primary/10 px-2 py-0.5 rounded-md"><FileText className="h-2.5 w-2.5" /> Brochure</span>}
                    </div>
                  )}

                  {isAwaitingOTP ? (
                    <div className="space-y-4">
                      <PhoneVerificationField
                        autoTrigger
                        onVerified={handleVerified}
                        onReady={({ triggerSend }) => { triggerSendRef.current = triggerSend; }}
                      />
                      {isSubmitting && (
                        <div className="flex items-center justify-center gap-2 py-2">
                          <span className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                          <span className="text-sm text-muted-foreground">Submitting your information…</span>
                        </div>
                      )}
                      {form.formState.errors.root && (
                        <p className="text-xs text-destructive text-center">{form.formState.errors.root.message}</p>
                      )}
                      <button
                        type="button"
                        onClick={() => { setPendingData(null); setVerifiedPhone(null); }}
                        className="w-full text-xs text-muted-foreground hover:text-foreground underline text-center"
                      >
                        ← Go back and edit
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3.5">
                      <div className="space-y-1">
                        <Label htmlFor="mcta-name" className="text-xs font-semibold text-foreground/80">Full Name</Label>
                        <Input id="mcta-name" placeholder="John Smith" autoComplete="name" autoCapitalize="words"
                          {...form.register("fullName")}
                          className="h-12 text-[16px] rounded-lg border border-border focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all" />
                        {form.formState.errors.fullName && <p className="text-xs text-destructive">{form.formState.errors.fullName.message}</p>}
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="mcta-email" className="text-xs font-semibold text-foreground/80">Email Address</Label>
                        <Input id="mcta-email" type="email" inputMode="email" placeholder="john@email.com" autoComplete="email" autoCapitalize="none"
                          {...form.register("email")}
                          className="h-12 text-[16px] rounded-lg border border-border focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all" />
                        {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="mcta-phone" className="text-xs font-semibold text-foreground/80">Phone Number</Label>
                        <Input id="mcta-phone" type="tel" inputMode="tel" placeholder="604-555-0123" autoComplete="tel"
                          {...form.register("phone")}
                          className="h-12 text-[16px] rounded-lg border border-border focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all" />
                        {form.formState.errors.phone && <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>}
                      </div>

                      <div className="space-y-2.5 pt-1">
                        <div className="flex items-center gap-3">
                          <Checkbox id="mcta-agent" checked={form.watch("workingWithAgent")} onCheckedChange={(v) => form.setValue("workingWithAgent", v === true)}
                            className="h-[18px] w-[18px] rounded border-border/80 data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                          <Label htmlFor="mcta-agent" className="text-sm text-foreground/70 cursor-pointer select-none">I'm working with a real estate agent</Label>
                        </div>
                        <div className="flex items-center gap-3">
                          <Checkbox id="mcta-realtor" checked={form.watch("isRealtor")} onCheckedChange={(v) => form.setValue("isRealtor", v === true)}
                            className="h-[18px] w-[18px] rounded border-border/80 data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                          <Label htmlFor="mcta-realtor" className="text-sm text-foreground/70 cursor-pointer select-none">I am a Realtor</Label>
                        </div>
                      </div>

                      {form.formState.errors.root && (
                        <p className="text-xs text-destructive text-center">{form.formState.errors.root.message}</p>
                      )}

                      <Button type="submit" className="w-full h-12 font-semibold text-[15px] rounded-lg shadow-gold hover:shadow-gold-glow transition-all gap-2">
                        <Download className="h-4 w-4" />
                        {hasAnyDocuments ? "Get Instant Access" : "Request Information"}
                      </Button>

                      <p className="text-center text-[10px] text-muted-foreground/60">
                        <span className="text-primary/70">✓</span> No spam · <a href="/privacy" className="underline hover:text-foreground/60">Privacy Policy</a>
                      </p>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="py-3 bg-background"
            style={{ paddingLeft: "max(16px, env(safe-area-inset-left, 16px))", paddingRight: "max(16px, env(safe-area-inset-right, 16px))", paddingBottom: "max(16px, env(safe-area-inset-bottom, 16px))" }}>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" className="shrink-0 h-12 w-12 min-w-[48px] min-h-[48px] rounded-xl" asChild>
                <a href="tel:+16722581100" aria-label="Call agent"><Phone className="h-5 w-5" /></a>
              </Button>
              {whatsappLink && (
                <Button variant="outline" size="icon" className="shrink-0 h-12 w-12 min-w-[48px] min-h-[48px] rounded-xl text-primary border-border hover:bg-accent" asChild>
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp"><MessageCircle className="h-5 w-5" /></a>
                </Button>
              )}
              <Button size="lg" className="flex-1 h-14 min-h-[56px] rounded-xl font-semibold text-base gap-2 bg-foreground hover:bg-foreground/90 text-background"
                onClick={isExpanded ? () => setIsExpanded(false) : () => setIsExpanded(true)}>
                {isExpanded ? (
                  <><ChevronDown className="h-4 w-4" /><span>Close</span></>
                ) : (
                  <><Download className="h-4 w-4" /><span>{hasAnyDocuments ? "Get Floor Plans" : "Register Now"}</span></>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
