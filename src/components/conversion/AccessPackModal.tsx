import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, CheckCircle, MessageCircle, Shield, Send, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { getVisitorId, getSessionId, trackFormStart, trackFormSubmit } from "@/lib/tracking";
import { getIntentScore, getCityInterests, getTopViewedProjects } from "@/lib/tracking/intentScoring";
import { MetaEvents } from "@/components/tracking/MetaPixel";
import { useIsMobileOrTablet } from "@/hooks/use-mobile";
import { PhoneVerificationField } from "@/components/ui/PhoneVerificationField";
import { useLeadSubmission } from "@/hooks/useLeadSubmission";

const phoneRegex = /^[\+]?[1]?[-.\s]?[(]?[0-9]{3}[)]?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/;

const formSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(50),
  lastName: z.string().trim().min(1, "Last name is required").max(50),
  email: z.string().trim().email("Please enter a valid email").max(255),
  phone: z.string().trim().min(1, "Phone is required").regex(phoneRegex, "Enter a valid phone number"),
  persona: z.enum(["first_time", "investor"]),
  workingWithAgent: z.enum(["yes", "no", "i_am_realtor"]),
  timeline: z.enum(["0_3", "3_plus"]),
  propertyType: z.enum(["condo", "townhome"]),
  message: z.string().max(1000).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AccessPackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
  projectName?: string;
  variant?: "floorplans" | "fit_call" | "general_interest";
  source?: string;
}

const PERSONAS = [
  { value: "first_time", label: "First-time Buyer" },
  { value: "investor", label: "Investor" },
];

const AGENT_OPTIONS = [
  { value: "no", label: "No" },
  { value: "yes", label: "Yes" },
  { value: "i_am_realtor", label: "I am a Realtor" },
];

const TIMELINES = [
  { value: "0_3", label: "0–3 months" },
  { value: "3_plus", label: "3+ months" },
];

const PROPERTY_TYPES = [
  { value: "condo", label: "Condo" },
  { value: "townhome", label: "Townhome" },
];

export function AccessPackModal({
  open,
  onOpenChange,
  projectId,
  projectName,
  variant = "floorplans",
  source = "modal",
}: AccessPackModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);
  const [pendingData, setPendingData] = useState<FormData | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState<string>("16722581100");
  const triggerSendRef = useRef<((phone: string) => Promise<void>) | null>(null);
  const hasSentRef = useRef(false);
  const { toast } = useToast();
  const isMobileOrTablet = useIsMobileOrTablet();
  const { submitLead } = useLeadSubmission();

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
    if (open) {
      MetaEvents.formStart({
        content_name: projectName || "Access Pack",
        content_category: variant === "floorplans" ? "floorplans" : variant === "general_interest" ? "general_interest" : "callback",
      });
      trackFormStart({
        form_name: variant === "floorplans" ? "access_pack" : variant === "general_interest" ? "general_interest" : "callback_request",
        form_location: "access_pack_modal",
      });
    }
    if (!open) {
      setIsSuccess(false);
      setVerifiedPhone(null);
      setPendingData(null);
      hasSentRef.current = false;
      form.reset();
    }
  }, [open]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      persona: "first_time",
      workingWithAgent: "no",
      timeline: "0_3",
      propertyType: "condo",
      message: "",
    },
  });

  const completeLead = async (phone: string, data: FormData) => {
    setIsSubmitting(true);
    try {
      const utmSource = sessionStorage.getItem("utm_source") || null;
      const utmMedium = sessionStorage.getItem("utm_medium") || null;
      const utmCampaign = sessionStorage.getItem("utm_campaign") || null;
      const utmContent = sessionStorage.getItem("utm_content") || null;
      const utmTerm = sessionStorage.getItem("utm_term") || null;
      const referrer = sessionStorage.getItem("referrer") || document.referrer || null;
      const landingPage = sessionStorage.getItem("landing_page") || window.location.href;

      const messageData = [
        `First Name: ${data.firstName}`,
        `Last Name: ${data.lastName}`,
        `Persona: ${PERSONAS.find(p => p.value === data.persona)?.label}`,
        `Working with Agent: ${AGENT_OPTIONS.find(a => a.value === data.workingWithAgent)?.label}`,
        `Timeline: ${TIMELINES.find(t => t.value === data.timeline)?.label}`,
        `Property Type: ${PROPERTY_TYPES.find(pt => pt.value === data.propertyType)?.label}`,
        `Source: ${source}`,
        data.message ? `\n\nMessage: ${data.message}` : "",
      ].filter(Boolean).join(" | ");

      const nextDripAt = new Date().toISOString();
      const dripSequence = data.persona === "investor" ? "investor" : "buyer";
      const actualPersona = data.workingWithAgent === "i_am_realtor" ? "realtor" : data.persona;
      const fullName = `${data.firstName} ${data.lastName}`.trim();
      const visitorId = getVisitorId();
      const sessionId = getSessionId();
      const intentScore = getIntentScore();
      const cityInterest = getCityInterests();
      const projectInterest = getTopViewedProjects().map(p => p.project_id);
      const leadId = crypto.randomUUID();

      const { error } = await supabase.from("project_leads").insert({
        id: leadId,
        project_id: projectId || null,
        name: fullName,
        email: data.email,
        phone,
        message: messageData,
        persona: actualPersona,
        timeline: data.timeline,
        drip_sequence: dripSequence,
        last_drip_sent: 0,
        next_drip_at: nextDripAt,
        lead_source: source === "fit_call" ? "callback_request"
          : source === "general_interest" ? "general_interest"
          : source.startsWith("city_list_") ? source
          : source === "sticky_bar" ? "sticky_bar"
          : source === "header" ? "header_inquiry"
          : source === "modal" ? "floor_plan_request"
          : source,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        utm_content: utmContent,
        utm_term: utmTerm,
        referrer,
        landing_page: landingPage,
        visitor_id: visitorId,
        session_id: sessionId,
        intent_score: intentScore,
        city_interest: cityInterest,
        project_interest: projectInterest,
      });

      if (error) throw error;

      // Fire Lofty CRM sync with full tracking data (fire-and-forget)
      submitLead({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone,
        formType: "vip_access",
        projectName: projectName,
        projectUrl: window.location.href,
        message: messageData,
      });

      supabase.functions.invoke("send-project-lead", { body: { leadId } }).catch(console.error);

      trackFormSubmit({
        form_name: variant === "floorplans" ? "access_pack" : variant === "general_interest" ? "general_interest" : "callback_request",
        form_location: "access_pack_modal",
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone,
        user_type: actualPersona,
        project_name: projectName,
      });

      MetaEvents.lead({ content_name: projectName || "Access Pack", content_category: actualPersona });

      supabase.functions.invoke("meta-conversions-api", {
        body: {
          event_name: "Lead",
          email: data.email,
          phone,
          first_name: data.firstName,
          last_name: data.lastName,
          event_source_url: window.location.href,
          content_name: projectName || "Access Pack",
          content_category: actualPersona,
          client_user_agent: navigator.userAgent,
          fbc: document.cookie.match(/_fbc=([^;]+)/)?.[1],
          fbp: document.cookie.match(/_fbp=([^;]+)/)?.[1],
        },
      }).catch(console.error);

      localStorage.setItem("presale_persona", actualPersona);

      if (typeof window !== "undefined") {
        (window as any).gtag?.("event", "submit_access_pack", {
          page_path: window.location.pathname,
          project_name: projectName || "general",
          persona: actualPersona,
          timeline: data.timeline,
          working_with_agent: data.workingWithAgent,
        });
        (window as any).fbq?.("track", "Lead", {
          content_name: projectName || "Access Pack",
          content_category: actualPersona,
        });
      }

      setIsSuccess(true);
    } catch (error: any) {
      console.error("Error:", error);
      toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" });
      setPendingData(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerified = (phone: string) => {
    setVerifiedPhone(phone);
    if (pendingData) completeLead(phone, pendingData);
  };

  const handleReady = ({ triggerSend }: { triggerSend: (phone: string) => Promise<void> }) => {
    triggerSendRef.current = triggerSend;
    if (pendingData && !hasSentRef.current) {
      hasSentRef.current = true;
      triggerSend(pendingData.phone);
    }
  };

  const onSubmit = async (data: FormData) => {
    hasSentRef.current = false;
    setPendingData(data);
  };

  const whatsappMessage = encodeURIComponent(
    `Hi! I just requested the ${projectName || "presale"} package. Can you help me shortlist the best options in my budget?`
  );
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  const getTitle = () => {
    if (variant === "floorplans") return "Chat With Us";
    if (variant === "general_interest") return "Get New Home Updates";
    return "Request a Call Back";
  };

  const isAwaitingOTP = !!pendingData && !verifiedPhone;

  const FormContent = () => (
    <>
      {!isSuccess ? (
        <div className="p-5 sm:p-6 pb-8">
          {/* Header */}
          <div className="text-center mb-4 sm:mb-6">
            <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full mb-2">
              {variant === "floorplans" ? (
                <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              ) : variant === "general_interest" ? (
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              ) : (
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold">
              {isAwaitingOTP ? "Verify Your Phone" : getTitle()}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {isAwaitingOTP
                ? "Enter the 6-digit code we just sent you"
                : variant === "general_interest"
                ? "Be first to see new move-in-ready inventory"
                : projectName
                ? `Get expert guidance on ${projectName}`
                : "Connect with our presale experts"}
            </p>
            {!isAwaitingOTP && (
              <p className="text-xs text-green-600 font-medium mt-1">✓ Same-day callback available</p>
            )}
          </div>

          {/* OTP Step */}
          {isAwaitingOTP ? (
            <div className="space-y-4">
              <PhoneVerificationField
                autoTrigger
                defaultPhone={pendingData?.phone ?? ""}
                onVerified={handleVerified}
                onReady={handleReady}
              />
              {isSubmitting && (
                <div className="flex items-center justify-center gap-2 py-2">
                  <span className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  <span className="text-sm text-muted-foreground">Submitting your information…</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => { setPendingData(null); hasSentRef.current = false; }}
                className="w-full text-xs text-muted-foreground hover:text-foreground underline text-center"
              >
                ← Go back and edit
              </button>
            </div>
          ) : (
            /* Form Step */
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="firstName" className="text-xs sm:text-sm">
                      First Name <span className="text-destructive">*</span>
                    </Label>
                    <Input id="firstName" name="fname" placeholder="John" autoComplete="given-name" autoCapitalize="words"
                      {...form.register("firstName")} className="h-11 mt-1 text-[16px]" />
                    {form.formState.errors.firstName && (
                      <p className="text-xs text-destructive mt-1">{form.formState.errors.firstName.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-xs sm:text-sm">
                      Last Name <span className="text-destructive">*</span>
                    </Label>
                    <Input id="lastName" name="lname" placeholder="Smith" autoComplete="family-name" autoCapitalize="words"
                      {...form.register("lastName")} className="h-11 mt-1 text-[16px]" />
                    {form.formState.errors.lastName && (
                      <p className="text-xs text-destructive mt-1">{form.formState.errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="email" className="text-xs sm:text-sm">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input id="email" name="email" type="email" inputMode="email" placeholder="john@email.com"
                    autoComplete="email" autoCapitalize="none"
                    {...form.register("email")} className="h-11 mt-1 text-[16px]" />
                  {form.formState.errors.email && (
                    <p className="text-xs text-destructive mt-1">{form.formState.errors.email.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="apm-phone" className="text-xs sm:text-sm">
                    Phone <span className="text-destructive">*</span>
                  </Label>
                  <Input id="apm-phone" type="tel" inputMode="tel" placeholder="604-555-0123" autoComplete="tel"
                    {...form.register("phone")} className="h-11 mt-1 text-[16px]" />
                  {form.formState.errors.phone && (
                    <p className="text-xs text-destructive mt-1">{form.formState.errors.phone.message}</p>
                  )}
                </div>
              </div>

              {/* I am a... */}
              <div>
                <Label className="text-xs sm:text-sm font-medium">
                  I am a... <span className="text-destructive">*</span>
                </Label>
                <RadioGroup value={form.watch("persona")} onValueChange={(v) => form.setValue("persona", v as any)}
                  className="grid grid-cols-2 gap-2 mt-1.5">
                  {PERSONAS.map((p) => (
                    <Label key={p.value}
                      className={`flex items-center justify-center h-10 rounded-lg border-2 cursor-pointer text-sm transition-all ${
                        form.watch("persona") === p.value
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border hover:border-muted-foreground/50"
                      }`}>
                      <RadioGroupItem value={p.value} className="sr-only" />
                      {p.label}
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              {/* Working with agent */}
              <div>
                <Label className="text-xs sm:text-sm font-medium">
                  Working with a Realtor? <span className="text-destructive">*</span>
                </Label>
                <RadioGroup value={form.watch("workingWithAgent")} onValueChange={(v) => form.setValue("workingWithAgent", v as any)}
                  className="grid grid-cols-3 gap-2 mt-1.5">
                  {AGENT_OPTIONS.map((a) => (
                    <Label key={a.value}
                      className={`flex items-center justify-center h-10 rounded-lg border-2 cursor-pointer text-xs sm:text-sm transition-all ${
                        form.watch("workingWithAgent") === a.value
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border hover:border-muted-foreground/50"
                      }`}>
                      <RadioGroupItem value={a.value} className="sr-only" />
                      {a.label}
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              {/* Timeline & Property Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs sm:text-sm font-medium">
                    Timeline <span className="text-destructive">*</span>
                  </Label>
                  <RadioGroup value={form.watch("timeline")} onValueChange={(v) => form.setValue("timeline", v as any)}
                    className="grid grid-cols-1 gap-2 mt-1.5">
                    {TIMELINES.map((t) => (
                      <Label key={t.value}
                        className={`flex items-center justify-center h-10 rounded-lg border-2 cursor-pointer text-xs sm:text-sm transition-all ${
                          form.watch("timeline") === t.value
                            ? "border-primary bg-primary/10 text-primary font-medium"
                            : "border-border hover:border-muted-foreground/50"
                        }`}>
                        <RadioGroupItem value={t.value} className="sr-only" />
                        {t.label}
                      </Label>
                    ))}
                  </RadioGroup>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm font-medium">
                    Property Type <span className="text-destructive">*</span>
                  </Label>
                  <RadioGroup value={form.watch("propertyType")} onValueChange={(v) => form.setValue("propertyType", v as any)}
                    className="grid grid-cols-1 gap-2 mt-1.5">
                    {PROPERTY_TYPES.map((pt) => (
                      <Label key={pt.value}
                        className={`flex items-center justify-center h-10 rounded-lg border-2 cursor-pointer text-xs sm:text-sm transition-all ${
                          form.watch("propertyType") === pt.value
                            ? "border-primary bg-primary/10 text-primary font-medium"
                            : "border-border hover:border-muted-foreground/50"
                        }`}>
                        <RadioGroupItem value={pt.value} className="sr-only" />
                        {pt.label}
                      </Label>
                    ))}
                  </RadioGroup>
                </div>
              </div>

              <Button type="submit" size="lg"
                className="w-full h-12 font-semibold text-sm gap-2">
                <Send className="h-4 w-4" />
                {variant === "floorplans" ? "Get Instant Access" : variant === "general_interest" ? "Get Updates" : "Request Call Back"}
              </Button>

              <p className="text-center text-[10px] text-muted-foreground/60">
                <span className="text-primary/70">✓</span> No spam ·{" "}
                <a href="/privacy" className="underline hover:text-foreground/60">Privacy Policy</a>
              </p>
            </form>
          )}
        </div>
      ) : (
        /* Success State */
        <div className="p-6 sm:p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-2">You're All Set!</h2>
          <p className="text-muted-foreground text-sm mb-6">
            {variant === "general_interest"
              ? "You're on the list! We'll notify you as soon as new inventory becomes available."
              : "One of our agents will follow up within 24 hours."}
          </p>
          <Button asChild size="lg"
            className="w-full h-12 text-sm font-semibold bg-[#25D366] hover:bg-[#1ebe5a] text-white border-0">
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat Now on WhatsApp
            </a>
          </Button>
          <p className="text-xs text-muted-foreground mt-3">
            We're available 7 days a week to answer your questions.
          </p>
        </div>
      )}
    </>
  );

  if (isMobileOrTablet) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="p-0 rounded-t-3xl max-h-[90vh] overflow-y-auto">
          <SheetHeader className="sr-only">
            <SheetTitle>{getTitle()}</SheetTitle>
          </SheetHeader>
          <FormContent />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        <VisuallyHidden>
          <DialogTitle>{getTitle()}</DialogTitle>
        </VisuallyHidden>
        <FormContent />
      </DialogContent>
    </Dialog>
  );
}
