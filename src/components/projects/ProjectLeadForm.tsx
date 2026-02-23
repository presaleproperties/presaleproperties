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
  fullName: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Valid email required").max(255),
  phone: z.string().trim().min(1, "Phone is required").regex(phoneRegex, "Valid phone required"),
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
      if (data?.value) setWhatsappNumber(data.value as string);
    };
    fetchWhatsappNumber();
  }, []);

  const handleFormInteraction = () => {
    if (!formStartTracked) {
      setFormStartTracked(true);
      trackFormStart({ form_name: leadSource === "floor_plan_request" ? "floor_plan_request" : "project_inquiry", form_location: "project_lead_form" });
    }
  };

  const onSubmit = async (data: LeadFormData) => {
    setIsSubmitting(true);
    try {
      const leadId = crypto.randomUUID();
      const utmData = getUtmDataForSubmission();
      const actualPersona = data.isRealtor ? "realtor" : "buyer";
      const agentStatus = data.isRealtor ? "i_am_realtor" : data.workingWithRealtor ? "yes" : "no";

      const { error } = await supabase.from("project_leads").insert({
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
        utm_source: utmData.utm_source, utm_medium: utmData.utm_medium, utm_campaign: utmData.utm_campaign,
        utm_content: utmData.utm_content, utm_term: utmData.utm_term,
        referrer: utmData.referrer, landing_page: utmData.landing_page,
        visitor_id: getVisitorId(), session_id: getSessionId(),
        intent_score: getIntentScore(), city_interest: getCityInterests(),
        project_interest: getTopViewedProjects().map(p => p.project_id),
      });
      if (error) throw error;

      trackCTAClick({ cta_type: "lead_form_submit", cta_label: "Download Info", cta_location: "project_lead_form", project_id: projectId, project_name: projectName });
      trackFormSubmit({ form_name: leadSource === "floor_plan_request" ? "floor_plan_request" : "project_inquiry", form_location: "project_lead_form", first_name: data.fullName, last_name: "", email: data.email, phone: data.phone, user_type: actualPersona, project_id: projectId, project_name: projectName });

      supabase.functions.invoke("trigger-workflow", { body: { event: "project_inquiry", data: { email: data.email, first_name: data.fullName, last_name: "", project_name: projectName, project_id: projectId }, meta: { lead_id: leadId, source: leadSource } } }).catch(console.error);
      supabase.functions.invoke("send-project-lead", { body: { leadId } }).catch(console.error);
      supabase.functions.invoke("meta-conversions-api", { body: { event_name: "Lead", email: data.email, phone: data.phone, first_name: data.fullName, last_name: "", event_source_url: window.location.href, content_name: projectName, content_category: actualPersona, client_user_agent: navigator.userAgent, fbc: document.cookie.match(/_fbc=([^;]+)/)?.[1], fbp: document.cookie.match(/_fbp=([^;]+)/)?.[1] } }).catch(console.error);

      localStorage.setItem("presale_persona", actualPersona);
      localStorage.setItem("pp_form_submitted", "true");
      localStorage.setItem("presale_lead_converted", "true");

      if (typeof window !== "undefined") {
        if ((window as any).gtag) (window as any).gtag("event", "submit_access_pack", { page_path: window.location.pathname, project_name: projectName, persona: actualPersona, source: "project_lead_form" });
        if ((window as any).fbq) (window as any).fbq("track", "Lead", { content_name: projectName, content_category: actualPersona });
      }

      setIsSuccess(true);
      toast({ title: "Request submitted!", description: "We'll be in touch shortly." });
    } catch (error: any) {
      console.error("Error submitting lead:", error);
      toast({ title: "Submission failed", description: error?.message || "Please try again later.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const whatsappMessage = encodeURIComponent(`Hi! I just submitted my info for ${projectName} and would love to learn more.`);
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  // ========================================
  // SUCCESS STATE
  // ========================================
  if (isSuccess) {
    const hasValidUrl = (url: string | null | undefined): url is string => Boolean(url && url.trim().length > 0);
    const hasBrochure = hasValidUrl(brochureUrl);
    const hasFloorplan = hasValidUrl(floorplanUrl);
    const hasPricing = hasValidUrl(pricingUrl);
    const hasAnyDocuments = hasBrochure || hasFloorplan || hasPricing;
    const isGoogleDriveLink = (url: string) => url.includes('drive.google.com') || url.includes('docs.google.com');

    return (
      <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-premium">
        <div className="h-0.5 bg-gradient-to-r from-primary via-primary/70 to-transparent" />
        <div className="bg-foreground px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-primary/15 rounded-xl">
              <CheckCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-background">You're All Set!</h3>
              <p className="text-xs text-background/45 font-medium">
                {hasAnyDocuments ? "Access your documents below." : "Check your email for details."}
              </p>
            </div>
          </div>
        </div>
        <div className="p-4 space-y-2">
          {hasAnyDocuments && (
            <>
              {hasFloorplan && (
                <Button asChild size="sm" className="w-full h-10 text-sm font-semibold rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground">
                  <a href={floorplanUrl!} target="_blank" rel="noopener noreferrer">
                    <LayoutGrid className="h-4 w-4 mr-2" />
                    {isGoogleDriveLink(floorplanUrl!) ? "View Floor Plans" : "Download Floor Plans"}
                    {isGoogleDriveLink(floorplanUrl!) && <ExternalLink className="h-3 w-3 ml-1" />}
                  </a>
                </Button>
              )}
              {hasPricing && (
                <Button asChild size="sm" variant={hasFloorplan ? "outline" : "default"} className="w-full h-10 text-sm font-semibold rounded-lg">
                  <a href={pricingUrl!} target="_blank" rel="noopener noreferrer">
                    <DollarSign className="h-4 w-4 mr-2" />
                    {isGoogleDriveLink(pricingUrl!) ? "View Pricing" : "Download Pricing"}
                  </a>
                </Button>
              )}
              {hasBrochure && (
                <Button asChild size="sm" variant="outline" className="w-full h-10 text-sm font-semibold rounded-lg">
                  <a href={brochureUrl!} target="_blank" rel="noopener noreferrer">
                    <FileText className="h-4 w-4 mr-2" />
                    {isGoogleDriveLink(brochureUrl!) ? "View Brochure" : "Download Brochure"}
                  </a>
                </Button>
              )}
            </>
          )}
          <Button asChild size="sm" variant={hasAnyDocuments ? "secondary" : "default"} className={`w-full h-10 text-sm font-semibold rounded-lg ${!hasAnyDocuments ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}>
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat with an Agent
            </a>
          </Button>
        </div>
      </div>
    );
  }

  // ========================================
  // COMPACT SINGLE-PAGE FORM
  // ========================================
  const title = status === "coming_soon" ? "Get Early Access" : status === "registering" ? "Register for VIP Access" : status === "active" ? "Get Floor Plans & Pricing" : "Get Notified";

  return (
    <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-premium relative">
      {onClose && (
        <button onClick={onClose} className="absolute right-3 top-3 z-10 p-1.5 rounded-full bg-background/10 text-background/70 hover:text-background hover:bg-background/20 transition-all" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
      )}
      <div className="h-0.5 bg-gradient-to-r from-primary via-primary/70 to-transparent" />

      {/* Header */}
      <div className="bg-foreground px-5 py-3.5 pr-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(var(--primary)/0.06),_transparent_60%)]" />
        <div className="relative">
          <h3 className="text-base lg:text-lg font-bold text-background leading-snug">{title}</h3>
          <p className="text-[11px] text-background/45 mt-0.5 font-medium">Instant access · No obligation</p>
        </div>
      </div>

      {/* Form */}
      <div className="p-4 sm:p-5">
        <form onSubmit={handleSubmit(onSubmit)} onFocus={handleFormInteraction} className="space-y-3">
          <div>
            <Input
              placeholder="Full Name"
              autoComplete="name"
              autoCapitalize="words"
              {...register("fullName")}
              className={`h-10 sm:h-10 text-[16px] sm:text-sm rounded-lg border bg-background placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all ${errors.fullName ? "border-destructive" : "border-border"}`}
            />
            {errors.fullName && <p className="text-[11px] text-destructive mt-1">{errors.fullName.message}</p>}
          </div>

          <div>
            <Input
              type="email"
              inputMode="email"
              placeholder="Email"
              autoComplete="email"
              autoCapitalize="none"
              {...register("email")}
              className={`h-10 sm:h-10 text-[16px] sm:text-sm rounded-lg border bg-background placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all ${errors.email ? "border-destructive" : "border-border"}`}
            />
            {errors.email && <p className="text-[11px] text-destructive mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <Input
              type="tel"
              inputMode="tel"
              placeholder="Phone"
              autoComplete="tel"
              {...register("phone")}
              className={`h-10 sm:h-10 text-[16px] sm:text-sm rounded-lg border bg-background placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all ${errors.phone ? "border-destructive" : "border-border"}`}
            />
            {errors.phone && <p className="text-[11px] text-destructive mt-1">{errors.phone.message}</p>}
          </div>

          {/* Compact checkboxes */}
          <div className="flex flex-col gap-2 pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <Checkbox
                checked={watch("workingWithRealtor")}
                onCheckedChange={(c) => setValue("workingWithRealtor", c === true)}
                className="h-4 w-4 rounded border-border/80 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <span className="text-[13px] text-foreground/70">Working with a Realtor</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <Checkbox
                checked={watch("isRealtor")}
                onCheckedChange={(c) => setValue("isRealtor", c === true)}
                className="h-4 w-4 rounded border-border/80 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <span className="text-[13px] text-foreground/70">I'm a Realtor</span>
            </label>
          </div>

          <Button
            type="submit"
            className="w-full h-10 text-sm font-semibold rounded-lg gap-2 shadow-gold hover:shadow-gold-glow transition-all"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Sending...
              </span>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download Info
              </>
            )}
          </Button>

          <p className="text-center text-[10px] text-muted-foreground/60">
            <span className="text-primary/70">✓</span> No spam · <a href="/privacy" className="underline hover:text-foreground/60">Privacy Policy</a>
          </p>
        </form>
      </div>
    </div>
  );
}
