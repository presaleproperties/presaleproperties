import { Phone, MessageCircle, Download, X, ChevronDown, CheckCircle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getVisitorId, getSessionId, trackFormStart, trackFormSubmit } from "@/lib/tracking";
import { getIntentScore, getCityInterests, getTopViewedProjects } from "@/lib/tracking/intentScoring";
import { MetaEvents } from "@/components/tracking/MetaPixel";

const phoneRegex = /^[\+]?[1]?[-.\s]?[(]?[0-9]{3}[)]?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/;

const formSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(50),
  lastName: z.string().trim().min(1, "Last name is required").max(50),
  email: z.string().trim().email("Please enter a valid email").max(255),
  phone: z.string().trim().min(1, "Phone is required").regex(phoneRegex, "Enter a valid phone number"),
  persona: z.enum(["first_time", "investor"]),
  workingWithAgent: z.enum(["yes", "no", "i_am_realtor"]),
});

type FormData = z.infer<typeof formSchema>;

interface ProjectMobileCTAProps {
  projectName: string;
  projectId?: string;
  status: "coming_soon" | "registering" | "active" | "sold_out";
  startingPrice?: number | null;
  onRegisterClick: () => void;
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

// Removed TIMELINES and PROPERTY_TYPES - no longer needed

export function ProjectMobileCTA({ 
  projectName,
  projectId,
  status, 
  startingPrice,
  onRegisterClick 
}: ProjectMobileCTAProps) {
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      persona: "first_time",
      workingWithAgent: "no",
    },
  });

  useEffect(() => {
    const fetchWhatsappNumber = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "whatsapp_number")
        .maybeSingle();
      
      if (data?.value) {
        setWhatsappNumber(String(data.value).replace(/"/g, ""));
      }
    };
    fetchWhatsappNumber();
  }, []);

  useEffect(() => {
    if (isExpanded) {
      // Track form start
      MetaEvents.formStart({
        content_name: projectName || "Access Pack",
        content_category: "floorplans",
      });
      trackFormStart({
        form_name: "mobile_footer_form",
        form_location: "mobile_cta_footer",
      });
    }
    if (!isExpanded) {
      setIsSuccess(false);
      form.reset();
    }
  }, [isExpanded]);

  const onSubmit = async (data: FormData) => {
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
        `Source: mobile_footer`,
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
      
      const { error } = await supabase
        .from("project_leads")
        .insert({
          id: leadId,
          project_id: projectId || null,
          name: fullName,
          email: data.email,
          phone: data.phone,
          message: messageData,
          persona: actualPersona,
          drip_sequence: dripSequence,
          last_drip_sent: 0,
          next_drip_at: nextDripAt,
          lead_source: "floor_plan_request",
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
          utm_content: utmContent,
          utm_term: utmTerm,
          referrer: referrer,
          landing_page: landingPage,
          visitor_id: visitorId,
          session_id: sessionId,
          intent_score: intentScore,
          city_interest: cityInterest,
          project_interest: projectInterest,
        });

      if (error) throw error;

      // Trigger edge function for Zapier webhook
      supabase.functions
        .invoke("send-project-lead", { body: { leadId } })
        .catch(console.error);

      // Track behavioral form submission
      trackFormSubmit({
        form_name: "mobile_footer_form",
        form_location: "mobile_cta_footer",
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        user_type: actualPersona,
        project_name: projectName,
      });

      // Track Meta Pixel Lead event
      MetaEvents.lead({
        content_name: projectName || "Access Pack",
        content_category: actualPersona,
      });

      // Send server-side Lead event to Meta Conversions API
      supabase.functions
        .invoke("meta-conversions-api", {
          body: {
            event_name: "Lead",
            email: data.email,
            phone: data.phone,
            first_name: data.firstName,
            last_name: data.lastName,
            event_source_url: window.location.href,
            content_name: projectName || "Access Pack",
            content_category: actualPersona,
            client_user_agent: navigator.userAgent,
            fbc: document.cookie.match(/_fbc=([^;]+)/)?.[1],
            fbp: document.cookie.match(/_fbp=([^;]+)/)?.[1],
          },
        })
        .catch((err) => console.error("Meta CAPI error:", err));

      localStorage.setItem("presale_persona", actualPersona);

      if (typeof window !== "undefined") {
        if ((window as any).gtag) {
          (window as any).gtag("event", "submit_access_pack", {
            page_path: window.location.pathname,
            project_name: projectName || "general",
            persona: actualPersona,
            working_with_agent: data.workingWithAgent,
          });
        }
        if ((window as any).fbq) {
          (window as any).fbq("track", "Lead", {
            content_name: projectName || "Access Pack",
            content_category: actualPersona,
          });
        }
      }

      setIsSuccess(true);
      toast({
        title: "Request submitted!",
        description: "We'll be in touch shortly.",
      });
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Something went wrong",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const whatsappMessage = encodeURIComponent(`Hi! I'm interested in ${projectName}. Can you send me more information?`);
  const whatsappLink = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${whatsappMessage}` : null;
  const successWhatsappMessage = encodeURIComponent(`Hi! I just requested the ${projectName} package. Can you help me shortlist the best options in my budget?`);
  const successWhatsappLink = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${successWhatsappMessage}` : null;

  const handleGetPricingClick = () => {
    setIsExpanded(true);
  };

  const handleClose = () => {
    setIsExpanded(false);
  };

  return (
    <>
      {/* Spacer to prevent content from being hidden behind fixed bar */}
      <div className="h-24 lg:hidden" aria-hidden="true" />
      
      {/* Fixed CTA bar - Portal-like rendering at viewport bottom with highest z-index */}
      <div 
        className="lg:hidden fixed inset-x-0 bottom-0"
        style={{
          zIndex: 99999,
          isolation: 'isolate',
          transform: 'translate3d(0,0,0)',
          WebkitTransform: 'translate3d(0,0,0)',
          willChange: 'transform',
          pointerEvents: 'auto',
          // Fix for Chrome mobile gap issue
          width: '100%',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div 
          className={`bg-background border-t border-border transition-all duration-300 ease-out ${
            isExpanded 
              ? 'rounded-t-3xl shadow-[0_-16px_50px_rgba(0,0,0,0.3)]' 
              : 'shadow-[0_-8px_30px_rgba(0,0,0,0.2)]'
          }`}
        >
          {/* Expanded Form View */}
          {isExpanded && (
            <div 
              className="overflow-y-auto overscroll-contain bg-background rounded-t-3xl"
              style={{ maxHeight: 'calc(85vh - 70px)' }}
            >
              {/* Premium Header with close button */}
              <div className="sticky top-0 bg-background z-10 rounded-t-3xl overflow-hidden">
                {/* Premium accent line */}
                <div className="h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/40" />
                <div className="px-5 pt-4 pb-3 border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                        <Download className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base tracking-tight">Get Pricing & Floor Plans</h3>
                        <p className="text-xs text-muted-foreground">{projectName}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full hover:bg-muted"
                      onClick={handleClose}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>

              {!isSuccess ? (
                <div className="p-5 pb-8">
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    {/* Contact Info */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="firstName" className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wider">
                          First Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="firstName"
                          placeholder="John"
                          autoComplete="given-name"
                          autoCapitalize="words"
                          {...form.register("firstName")}
                          className="h-12 mt-1.5 text-[16px] rounded-xl bg-muted/30 border-2 border-border/50 hover:border-border focus:border-primary/50 focus:bg-background focus:ring-2 focus:ring-primary/15 transition-all"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName" className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wider">
                          Last Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="lastName"
                          placeholder="Smith"
                          autoComplete="family-name"
                          autoCapitalize="words"
                          {...form.register("lastName")}
                          className="h-12 mt-1.5 text-[16px] rounded-xl bg-muted/30 border-2 border-border/50 hover:border-border focus:border-primary/50 focus:bg-background focus:ring-2 focus:ring-primary/15 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wider">
                        Email <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        inputMode="email"
                        placeholder="john@email.com"
                        autoComplete="email"
                        autoCapitalize="none"
                        {...form.register("email")}
                        className="h-12 mt-1.5 text-[16px] rounded-xl bg-muted/30 border-2 border-border/50 hover:border-border focus:border-primary/50 focus:bg-background focus:ring-2 focus:ring-primary/15 transition-all"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wider">
                        Phone <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        inputMode="tel"
                        placeholder="604-555-0123"
                        autoComplete="tel"
                        {...form.register("phone")}
                        className="h-12 mt-1.5 text-[16px] rounded-xl bg-muted/30 border-2 border-border/50 hover:border-border focus:border-primary/50 focus:bg-background focus:ring-2 focus:ring-primary/15 transition-all"
                      />
                    </div>

                    {/* I am a... */}
                    <div>
                      <Label className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wider">I am a...</Label>
                      <RadioGroup
                        value={form.watch("persona")}
                        onValueChange={(v) => form.setValue("persona", v as any)}
                        className="grid grid-cols-2 gap-2 mt-2"
                      >
                        {PERSONAS.map((p) => (
                          <Label
                            key={p.value}
                            className={`flex items-center justify-center h-11 rounded-xl border-2 cursor-pointer text-sm font-medium transition-all ${
                              form.watch("persona") === p.value
                                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                : "border-border/50 bg-muted/20 hover:border-primary/30 hover:bg-muted/40"
                            }`}
                          >
                            <RadioGroupItem value={p.value} className="sr-only" />
                            {p.label}
                          </Label>
                        ))}
                      </RadioGroup>
                    </div>

                    {/* Working with agent */}
                    <div>
                      <Label className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wider">Working with a Realtor?</Label>
                      <RadioGroup
                        value={form.watch("workingWithAgent")}
                        onValueChange={(v) => form.setValue("workingWithAgent", v as any)}
                        className="grid grid-cols-3 gap-2 mt-2"
                      >
                        {AGENT_OPTIONS.map((a) => (
                          <Label
                            key={a.value}
                            className={`flex items-center justify-center h-11 rounded-xl border-2 cursor-pointer text-xs font-medium transition-all ${
                              form.watch("workingWithAgent") === a.value
                                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                : "border-border/50 bg-muted/20 hover:border-primary/30 hover:bg-muted/40"
                            }`}
                          >
                            <RadioGroupItem value={a.value} className="sr-only" />
                            {a.label}
                          </Label>
                        ))}
                      </RadioGroup>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-14 font-bold text-base rounded-xl shadow-[0_4px_14px_hsl(var(--primary)/0.4)] hover:shadow-[0_6px_20px_hsl(var(--primary)/0.5)] transition-all mt-3" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          Sending...
                        </span>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Download Info
                        </>
                      )}
                    </Button>

                    {/* Trust indicators */}
                    <div className="flex items-center justify-center gap-3 pt-1">
                      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
                        <span className="text-primary">✓</span> No spam
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
                        <span className="text-primary">✓</span> Instant access
                      </span>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 rounded-2xl mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Request Sent!</h3>
                  <p className="text-sm text-muted-foreground mb-5">
                    Check your email for floor plans and pricing details.
                  </p>
                  {successWhatsappLink && (
                    <Button asChild className="w-full h-12 bg-green-600 hover:bg-green-700 rounded-xl mb-3">
                      <a href={successWhatsappLink} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Chat on WhatsApp
                      </a>
                    </Button>
                  )}
                  <Button variant="outline" className="w-full h-12 rounded-xl" onClick={handleClose}>
                    Close
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Collapsed CTA Bar - Solid premium background */}
          <div 
            className="py-3 bg-background"
            style={{
              paddingLeft: 'max(16px, env(safe-area-inset-left, 16px))',
              paddingRight: 'max(16px, env(safe-area-inset-right, 16px))',
              paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
            }}
          >
            <div className="flex items-center gap-3">
              {/* Phone Button */}
              <Button 
                variant="outline" 
                size="icon"
                className="shrink-0 h-12 w-12 min-w-[48px] min-h-[48px] rounded-xl touch-active"
                asChild
              >
                <a href="tel:+16722581100" aria-label="Call agent">
                  <Phone className="h-5 w-5" />
                </a>
              </Button>

              {/* WhatsApp Button */}
              {whatsappLink && (
                <Button 
                  variant="outline" 
                  size="icon"
                  className="shrink-0 h-12 w-12 min-w-[48px] min-h-[48px] rounded-xl text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 touch-active"
                  asChild
                >
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp">
                    <MessageCircle className="h-5 w-5" />
                  </a>
                </Button>
              )}

              {/* Primary CTA */}
              <Button 
                size="lg"
                className="flex-1 h-14 min-h-[56px] rounded-xl font-semibold text-base gap-2 bg-foreground hover:bg-foreground/90 text-background touch-active"
                onClick={isExpanded ? handleClose : handleGetPricingClick}
              >
                {isExpanded ? (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    <span>Close</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span>Download Info</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
