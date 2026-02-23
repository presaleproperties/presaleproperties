import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle, Download, MessageCircle, X, ExternalLink, FileText, LayoutGrid, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getUtmDataForSubmission } from "@/hooks/useUtmTracking";
import { trackCTAClick } from "@/hooks/useLoftyTracking";
import { trackFormStart, trackFormSubmit, getVisitorId, getSessionId } from "@/lib/tracking";
import { getIntentScore, getCityInterests, getTopViewedProjects } from "@/lib/tracking/intentScoring";

const phoneRegex = /^[\+]?[1]?[-.\s]?[(]?[0-9]{3}[)]?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/;

const leadSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").max(100),
  email: z.string().trim().email("Please enter a valid email").max(255),
  phone: z.string().trim().min(1, "Phone is required").regex(phoneRegex, "Enter a valid phone number"),
  isRealtor: z.boolean().default(false),
  workingWithRealtor: z.boolean().default(false),
});

type LeadFormData = z.infer<typeof leadSchema>;

interface ProjectLeadFormProps {
  projectId: string;
  projectName: string;
  status: "coming_soon" | "registering" | "active" | "sold_out";
  brochureUrl?: string | null;
  floorplanUrl?: string | null;
  pricingUrl?: string | null;
  leadSource?: "floor_plan_request" | "general_inquiry" | "scheduler";
  onClose?: () => void;
}

export function ProjectLeadForm({ projectId, projectName, status, brochureUrl, floorplanUrl, pricingUrl, leadSource = "floor_plan_request", onClose }: ProjectLeadFormProps) {
  const [whatsappNumber, setWhatsappNumber] = useState<string>("16722581100");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formStartTracked, setFormStartTracked] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: { fullName: "", email: "", phone: "", isRealtor: false, workingWithRealtor: false },
  });

  useEffect(() => {
    const fetchWhatsappNumber = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "whatsapp_number")
        .maybeSingle();
      if (data?.value) {
        setWhatsappNumber(data.value as string);
      }
    };
    fetchWhatsappNumber();
  }, []);

  const handleFormInteraction = () => {
    if (!formStartTracked) {
      setFormStartTracked(true);
      trackFormStart({
        form_name: leadSource === "floor_plan_request" ? "floor_plan_request" : "project_inquiry",
        form_location: "project_lead_form",
      });
    }
  };

  const onSubmit = async (data: LeadFormData) => {
    setIsSubmitting(true);
    try {
      const leadId = crypto.randomUUID();
      const utmData = getUtmDataForSubmission();
      const visitorId = getVisitorId();
      const sessionId = getSessionId();
      const intentScore = getIntentScore();
      const cityInterest = getCityInterests();
      const projectInterest = getTopViewedProjects().map(p => p.project_id);
      const actualPersona = data.isRealtor ? "realtor" : "buyer";
      const agentStatus = data.isRealtor ? "i_am_realtor" : data.workingWithRealtor ? "yes" : "no";

      const { error } = await supabase
        .from("project_leads")
        .insert({
          id: leadId,
          project_id: projectId || null,
          name: data.fullName,
          email: data.email,
          phone: data.phone,
          message: data.isRealtor ? "I'm a Realtor" : data.workingWithRealtor ? "Working with a Realtor" : null,
          persona: actualPersona,
          drip_sequence: actualPersona,
          last_drip_sent: 0,
          next_drip_at: new Date().toISOString(),
          lead_source: leadSource,
          agent_status: agentStatus,
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

      // Track events
      trackCTAClick({
        cta_type: "lead_form_submit",
        cta_label: "Download Info",
        cta_location: "project_lead_form",
        project_id: projectId,
        project_name: projectName,
      });

      trackFormSubmit({
        form_name: leadSource === "floor_plan_request" ? "floor_plan_request" : "project_inquiry",
        form_location: "project_lead_form",
        first_name: data.fullName,
        last_name: "",
        email: data.email,
        phone: data.phone,
        user_type: actualPersona,
        project_id: projectId,
        project_name: projectName,
      });

      // Trigger workflows (non-blocking)
      supabase.functions.invoke("trigger-workflow", {
        body: {
          event: "project_inquiry",
          data: { email: data.email, first_name: data.fullName, last_name: "", project_name: projectName, project_id: projectId },
          meta: { lead_id: leadId, source: leadSource },
        },
      }).catch(console.error);

      supabase.functions.invoke("send-project-lead", { body: { leadId } }).catch(console.error);

      supabase.functions.invoke("meta-conversions-api", {
        body: {
          event_name: "Lead",
          email: data.email,
          phone: data.phone,
          first_name: data.fullName,
          last_name: "",
          event_source_url: window.location.href,
          content_name: projectName,
          content_category: actualPersona,
          client_user_agent: navigator.userAgent,
          fbc: document.cookie.match(/_fbc=([^;]+)/)?.[1],
          fbp: document.cookie.match(/_fbp=([^;]+)/)?.[1],
        },
      }).catch(console.error);

      localStorage.setItem("presale_persona", actualPersona);
      localStorage.setItem("pp_form_submitted", "true");
      localStorage.setItem("presale_lead_converted", "true");

      if (typeof window !== "undefined") {
        if ((window as any).gtag) {
          (window as any).gtag("event", "submit_access_pack", {
            page_path: window.location.pathname,
            project_name: projectName,
            persona: actualPersona,
            source: "project_lead_form",
          });
        }
        if ((window as any).fbq) {
          (window as any).fbq("track", "Lead", { content_name: projectName, content_category: actualPersona });
        }
      }

      setIsSuccess(true);
      toast({
        title: "Request submitted!",
        description: "We'll be in touch shortly.",
      });
    } catch (error: any) {
      console.error("Error submitting lead:", error);
      toast({
        title: "Submission failed",
        description: error?.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ========================================
  // FORM CONTENT BY STATUS
  // ========================================
  const getFormContent = () => {
    switch (status) {
      case "coming_soon":
        return { title: "Get Early Access to Floor Plans & Pricing", buttonText: "Download Info" };
      case "registering":
        return { title: "Register for VIP Access", buttonText: "Download Info" };
      case "active":
        return { title: "Get Floor Plans & Pricing", buttonText: "Download Info" };
      default:
        return { title: "Get Notified of Similar Projects", buttonText: "Download Info" };
    }
  };

  const content = getFormContent();
  const whatsappMessage = encodeURIComponent(`Hi! I just submitted my info for ${projectName} and would love to learn more.`);
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  // ========================================
  // SUCCESS STATE
  // ========================================
  if (isSuccess) {
    const hasValidUrl = (url: string | null | undefined): url is string =>
      Boolean(url && url.trim().length > 0);

    const hasBrochure = hasValidUrl(brochureUrl);
    const hasFloorplan = hasValidUrl(floorplanUrl);
    const hasPricing = hasValidUrl(pricingUrl);
    const hasAnyDocuments = hasBrochure || hasFloorplan || hasPricing;

    const isGoogleDriveLink = (url: string) => url.includes('drive.google.com') || url.includes('docs.google.com');

    return (
      <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-premium">
        <div className="h-0.5 bg-gradient-to-r from-primary via-primary/70 to-transparent" />
        <div className="bg-foreground px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/15 rounded-xl">
              <CheckCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-background">You're All Set!</h3>
              <p className="text-xs text-background/45 font-medium">
                {hasAnyDocuments ? "Access your documents below." : "Check your email for pricing & floor plans."}
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-3">
          {hasAnyDocuments && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Your Documents</p>
              {hasFloorplan && (
                <Button asChild size="lg" className="w-full h-12 text-sm font-semibold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground">
                  <a href={floorplanUrl!} target="_blank" rel="noopener noreferrer">
                    <LayoutGrid className="h-4 w-4 mr-2" />
                    {isGoogleDriveLink(floorplanUrl!) ? "View Floor Plans" : "Download Floor Plans"}
                    {isGoogleDriveLink(floorplanUrl!) && <ExternalLink className="h-3 w-3 ml-1.5" />}
                  </a>
                </Button>
              )}
              {hasPricing && (
                <Button asChild size="lg" variant={hasFloorplan ? "outline" : "default"} className="w-full h-12 text-sm font-semibold rounded-xl">
                  <a href={pricingUrl!} target="_blank" rel="noopener noreferrer">
                    <DollarSign className="h-4 w-4 mr-2" />
                    {isGoogleDriveLink(pricingUrl!) ? "View Pricing Sheet" : "Download Pricing"}
                    {isGoogleDriveLink(pricingUrl!) && <ExternalLink className="h-3 w-3 ml-1.5" />}
                  </a>
                </Button>
              )}
              {hasBrochure && (
                <Button asChild size="lg" variant="outline" className="w-full h-12 text-sm font-semibold rounded-xl">
                  <a href={brochureUrl!} target="_blank" rel="noopener noreferrer">
                    <FileText className="h-4 w-4 mr-2" />
                    {isGoogleDriveLink(brochureUrl!) ? "View Brochure" : "Download Brochure"}
                    {isGoogleDriveLink(brochureUrl!) && <ExternalLink className="h-3 w-3 ml-1.5" />}
                  </a>
                </Button>
              )}
            </div>
          )}

          <Button
            asChild
            size="lg"
            variant={hasAnyDocuments ? "secondary" : "default"}
            className={`w-full h-12 text-sm font-semibold rounded-xl ${!hasAnyDocuments ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
          >
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat with an Agent Now
            </a>
          </Button>
        </div>
      </div>
    );
  }

  // ========================================
  // SINGLE-PAGE FORM
  // ========================================
  return (
    <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-premium transition-shadow duration-300 relative">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 p-1.5 rounded-full bg-background/10 text-background/70 hover:text-background hover:bg-background/20 transition-all"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {/* Premium accent line */}
      <div className="h-0.5 bg-gradient-to-r from-primary via-primary/70 to-transparent" />

      {/* Header */}
      <div className="bg-foreground px-5 sm:px-6 py-4 sm:py-5 pr-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(var(--primary)/0.06),_transparent_60%)]" />
        <div className="relative">
          {brochureUrl && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-medium tracking-wide text-primary bg-primary/15 px-2.5 py-1 rounded-md mb-2.5">
              <Download className="h-3 w-3" />
              Brochure Available
            </span>
          )}
          <h3 className="text-lg lg:text-xl font-bold text-background leading-snug">
            {content.title}
          </h3>
          <p className="text-xs text-background/45 mt-1 font-medium">
            Instant access · No obligation
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="p-5 sm:p-6">
        <form onSubmit={handleSubmit(onSubmit)} onFocus={handleFormInteraction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="lead-fullName" className="text-xs font-semibold text-foreground/80">
              Full Name
            </Label>
            <Input
              id="lead-fullName"
              placeholder="John Smith"
              autoComplete="name"
              autoCapitalize="words"
              enterKeyHint="next"
              {...register("fullName")}
              className={`h-12 sm:h-11 text-[16px] sm:text-sm rounded-lg border border-border bg-background shadow-[inset_0_1px_2px_hsl(var(--foreground)/0.04)] placeholder:text-muted-foreground/40 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all ${errors.fullName ? "border-destructive" : ""}`}
            />
            {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lead-email" className="text-xs font-semibold text-foreground/80">
              Email Address
            </Label>
            <Input
              id="lead-email"
              type="email"
              inputMode="email"
              placeholder="john@email.com"
              autoComplete="email"
              autoCapitalize="none"
              enterKeyHint="next"
              {...register("email")}
              className={`h-12 sm:h-11 text-[16px] sm:text-sm rounded-lg border border-border bg-background shadow-[inset_0_1px_2px_hsl(var(--foreground)/0.04)] placeholder:text-muted-foreground/40 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all ${errors.email ? "border-destructive" : ""}`}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lead-phone" className="text-xs font-semibold text-foreground/80">
              Phone
            </Label>
            <Input
              id="lead-phone"
              type="tel"
              inputMode="tel"
              placeholder="(604) 555-0123"
              autoComplete="tel"
              enterKeyHint="done"
              {...register("phone")}
              className={`h-12 sm:h-11 text-[16px] sm:text-sm rounded-lg border border-border bg-background shadow-[inset_0_1px_2px_hsl(var(--foreground)/0.04)] placeholder:text-muted-foreground/40 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all ${errors.phone ? "border-destructive" : ""}`}
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>

          {/* Checkboxes */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-3">
              <Checkbox
                id="lead-workingWithRealtor"
                checked={watch("workingWithRealtor")}
                onCheckedChange={(checked) => setValue("workingWithRealtor", checked === true)}
                className="h-[18px] w-[18px] rounded border-border/80 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-colors"
              />
              <Label htmlFor="lead-workingWithRealtor" className="text-sm text-foreground/70 cursor-pointer select-none">
                Are you working with a Realtor?
              </Label>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                id="lead-isRealtor"
                checked={watch("isRealtor")}
                onCheckedChange={(checked) => setValue("isRealtor", checked === true)}
                className="h-[18px] w-[18px] rounded border-border/80 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-colors"
              />
              <Label htmlFor="lead-isRealtor" className="text-sm text-foreground/70 cursor-pointer select-none">
                I'm a Realtor
              </Label>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 sm:h-11 text-sm font-semibold rounded-lg gap-2 shadow-gold hover:shadow-gold-glow transition-all"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Submitting...
              </span>
            ) : (
              <>
                <Download className="h-4 w-4" />
                {content.buttonText}
              </>
            )}
          </Button>

          <p className="text-center text-[10px] text-muted-foreground/60">
            <span className="text-primary/70">✓</span> Instant access · No spam · <a href="/privacy" className="underline hover:text-foreground/60">Privacy Policy</a>
          </p>
        </form>
      </div>
    </div>
  );
}
