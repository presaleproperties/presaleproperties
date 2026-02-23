import { Phone, MessageCircle, Download, X, ChevronDown, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MetaEvents } from "@/components/tracking/MetaPixel";
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

interface ProjectMobileCTAProps {
  projectName: string;
  projectId?: string;
  status: "coming_soon" | "registering" | "active" | "sold_out";
  startingPrice?: number | null;
  onRegisterClick: () => void;
}

export function ProjectMobileCTA({ 
  projectName,
  projectId,
  status, 
  startingPrice,
  onRegisterClick 
}: ProjectMobileCTAProps) {
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
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
    reset,
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: { fullName: "", email: "", phone: "", isRealtor: false, workingWithRealtor: false },
  });

  useEffect(() => {
    const fetchWhatsappNumber = async () => {
      const { data } = await supabase.from("app_settings").select("value").eq("key", "whatsapp_number").maybeSingle();
      if (data?.value) setWhatsappNumber(String(data.value).replace(/"/g, ""));
    };
    fetchWhatsappNumber();
  }, []);

  useEffect(() => {
    if (isExpanded) {
      MetaEvents.formStart({ content_name: projectName || "Access Pack", content_category: "floorplans" });
    }
    if (!isExpanded) { setIsSuccess(false); reset(); }
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

  const handleFormInteraction = () => {
    if (!formStartTracked) {
      setFormStartTracked(true);
      trackFormStart({ form_name: "floor_plan_request", form_location: "mobile_cta_footer" });
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
        id: leadId, project_id: projectId || null,
        name: data.fullName, email: data.email, phone: data.phone,
        message: data.isRealtor ? "I'm a Realtor" : data.workingWithRealtor ? "Working with a Realtor" : null,
        persona: actualPersona, drip_sequence: actualPersona, last_drip_sent: 0,
        next_drip_at: new Date().toISOString(), lead_source: "floor_plan_request", agent_status: agentStatus,
        utm_source: utmData.utm_source, utm_medium: utmData.utm_medium, utm_campaign: utmData.utm_campaign,
        utm_content: utmData.utm_content, utm_term: utmData.utm_term,
        referrer: utmData.referrer, landing_page: utmData.landing_page,
        visitor_id: getVisitorId(), session_id: getSessionId(),
        intent_score: getIntentScore(), city_interest: getCityInterests(),
        project_interest: getTopViewedProjects().map(p => p.project_id),
      });
      if (error) throw error;

      trackCTAClick({ cta_type: "lead_form_submit", cta_label: "Download Info", cta_location: "mobile_cta_footer", project_id: projectId, project_name: projectName });
      trackFormSubmit({ form_name: "floor_plan_request", form_location: "mobile_cta_footer", first_name: data.fullName, last_name: "", email: data.email, phone: data.phone, user_type: actualPersona, project_id: projectId, project_name: projectName });
      supabase.functions.invoke("trigger-workflow", { body: { event: "project_inquiry", data: { email: data.email, first_name: data.fullName, last_name: "", project_name: projectName, project_id: projectId }, meta: { lead_id: leadId, source: "floor_plan_request" } } }).catch(console.error);
      supabase.functions.invoke("send-project-lead", { body: { leadId } }).catch(console.error);
      supabase.functions.invoke("meta-conversions-api", { body: { event_name: "Lead", email: data.email, phone: data.phone, first_name: data.fullName, last_name: "", event_source_url: window.location.href, content_name: projectName, content_category: actualPersona, client_user_agent: navigator.userAgent, fbc: document.cookie.match(/_fbc=([^;]+)/)?.[1], fbp: document.cookie.match(/_fbp=([^;]+)/)?.[1] } }).catch(console.error);

      localStorage.setItem("presale_persona", actualPersona);
      localStorage.setItem("pp_form_submitted", "true");
      localStorage.setItem("presale_lead_converted", "true");

      if (typeof window !== "undefined") {
        if ((window as any).gtag) (window as any).gtag("event", "submit_access_pack", { page_path: window.location.pathname, project_name: projectName, persona: actualPersona, source: "mobile_cta_footer" });
        if ((window as any).fbq) (window as any).fbq("track", "Lead", { content_name: projectName, content_category: actualPersona });
      }

      MetaEvents.lead({ content_name: projectName || "Access Pack", content_category: actualPersona });
      setIsSuccess(true);
      toast({ title: "Request submitted!", description: "We'll be in touch shortly." });
    } catch (error: any) {
      console.error("Error submitting lead:", error);
      toast({ title: "Submission failed", description: error?.message || "Please try again later.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const whatsappMessage = encodeURIComponent(`Hi! I'm interested in ${projectName}. Can you send me more information?`);
  const whatsappLink = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${whatsappMessage}` : null;
  const successWhatsappMessage = encodeURIComponent(`Hi! I just requested the ${projectName} package. Can you help me shortlist the best options in my budget?`);
  const successWhatsappLink = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${successWhatsappMessage}` : null;

  return (
    <>
      <div className="h-24 lg:hidden" aria-hidden="true" />
      
      <div 
        className={`lg:hidden fixed inset-x-0 bottom-0 transition-transform duration-200 ${isHidden ? 'translate-y-full' : 'translate-y-0'}`}
        style={{ zIndex: 99999, isolation: 'isolate', willChange: 'transform', pointerEvents: 'auto', width: '100%' }}
      >
        <div className={`bg-background border-t border-border transition-all duration-300 ease-out ${isExpanded ? 'rounded-t-3xl shadow-[0_-16px_50px_rgba(0,0,0,0.3)]' : 'shadow-[0_-8px_30px_rgba(0,0,0,0.2)]'}`}>
          
          {/* Expanded Form */}
          {isExpanded && (
            <div className="overflow-y-auto overscroll-contain bg-background rounded-t-3xl" style={{ maxHeight: 'calc(85vh - 70px)' }}>
              {/* Header */}
              <div className="sticky top-0 bg-background z-10 rounded-t-3xl overflow-hidden">
                <div className="h-0.5 bg-gradient-to-r from-primary via-primary/70 to-transparent" />
                <div className="px-5 pt-4 pb-3 border-b border-border/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-base tracking-tight">
                        {isSuccess ? "Request Sent!" : "Get Pricing & Floor Plans"}
                      </h3>
                      <p className="text-[11px] text-muted-foreground">{projectName}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted -mr-1" onClick={() => setIsExpanded(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {isSuccess ? (
                <div className="p-5 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-2xl mb-3">
                    <CheckCircle className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-1">Request Sent!</h3>
                  <p className="text-sm text-muted-foreground mb-4">Check your email for details.</p>
                  {successWhatsappLink && (
                    <Button asChild variant="outline" className="w-full h-10 rounded-lg mb-2 font-semibold text-sm">
                      <a href={successWhatsappLink} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Chat on WhatsApp
                      </a>
                    </Button>
                  )}
                  <Button variant="ghost" className="w-full h-9 rounded-lg text-muted-foreground text-sm" onClick={() => setIsExpanded(false)}>Close</Button>
                </div>
              ) : (
                /* Compact form */
                <div className="p-4 pb-6">
                  <form onSubmit={handleSubmit(onSubmit)} onFocus={handleFormInteraction} className="space-y-3">
                    <div>
                      <Input
                        placeholder="Full Name"
                        autoComplete="name"
                        autoCapitalize="words"
                        autoFocus
                        {...register("fullName")}
                        className={`h-11 text-[16px] rounded-lg border bg-background placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/10 ${errors.fullName ? "border-destructive" : "border-border"}`}
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
                        className={`h-11 text-[16px] rounded-lg border bg-background placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/10 ${errors.email ? "border-destructive" : "border-border"}`}
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
                        className={`h-11 text-[16px] rounded-lg border bg-background placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/10 ${errors.phone ? "border-destructive" : "border-border"}`}
                      />
                      {errors.phone && <p className="text-[11px] text-destructive mt-1">{errors.phone.message}</p>}
                    </div>

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

                    <Button type="submit" className="w-full h-12 font-semibold text-[15px] rounded-lg shadow-gold hover:shadow-gold-glow transition-all gap-2" disabled={isSubmitting}>
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
                      <span className="text-primary/70">✓</span> No spam
                    </p>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* Collapsed CTA Bar */}
          <div 
            className="py-3 bg-background"
            style={{
              paddingLeft: 'max(16px, env(safe-area-inset-left, 16px))',
              paddingRight: 'max(16px, env(safe-area-inset-right, 16px))',
              paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
            }}
          >
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" className="shrink-0 h-12 w-12 min-w-[48px] min-h-[48px] rounded-xl touch-active" asChild>
                <a href="tel:+16722581100" aria-label="Call agent"><Phone className="h-5 w-5" /></a>
              </Button>
              {whatsappLink && (
                <Button variant="outline" size="icon" className="shrink-0 h-12 w-12 min-w-[48px] min-h-[48px] rounded-xl text-primary border-border hover:bg-accent touch-active" asChild>
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp"><MessageCircle className="h-5 w-5" /></a>
                </Button>
              )}
              <Button 
                size="lg"
                className="flex-1 h-14 min-h-[56px] rounded-xl font-semibold text-base gap-2 bg-foreground hover:bg-foreground/90 text-background touch-active"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? <><ChevronDown className="h-4 w-4" /><span>Close</span></> : <><Download className="h-4 w-4" /><span>Download Info</span></>}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
