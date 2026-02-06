import { Phone, MessageCircle, Download, X, ChevronDown, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  fullName: z.string().trim().min(1, "Full name is required").max(100),
  email: z.string().trim().email("Please enter a valid email").max(255),
  phone: z.string().trim().min(1, "Phone is required").regex(phoneRegex, "Enter a valid phone number"),
  isRealtor: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      isRealtor: false,
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
      
      const actualPersona = data.isRealtor ? "realtor" : "buyer";
      const messageData = data.isRealtor ? "I'm a Realtor | Source: mobile_footer" : "Source: mobile_footer";

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
          name: data.fullName,
          email: data.email,
          phone: data.phone,
          message: messageData,
          persona: actualPersona,
          drip_sequence: "buyer",
          last_drip_sent: 0,
          next_drip_at: new Date().toISOString(),
          lead_source: "floor_plan_request",
          agent_status: data.isRealtor ? "i_am_realtor" : "no",
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

      supabase.functions.invoke("send-project-lead", { body: { leadId } }).catch(console.error);

      trackFormSubmit({
        form_name: "mobile_footer_form",
        form_location: "mobile_cta_footer",
        first_name: data.fullName,
        last_name: "",
        email: data.email,
        phone: data.phone,
        user_type: actualPersona,
        project_name: projectName,
      });

      MetaEvents.lead({
        content_name: projectName || "Access Pack",
        content_category: actualPersona,
      });

      supabase.functions.invoke("meta-conversions-api", {
        body: {
          event_name: "Lead",
          email: data.email,
          phone: data.phone,
          first_name: data.fullName,
          last_name: "",
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
        if ((window as any).gtag) {
          (window as any).gtag("event", "submit_access_pack", {
            page_path: window.location.pathname,
            project_name: projectName || "general",
            persona: actualPersona,
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

  return (
    <>
      {/* Spacer */}
      <div className="h-24 lg:hidden" aria-hidden="true" />
      
      {/* Fixed CTA bar */}
      <div 
        className="lg:hidden fixed inset-x-0 bottom-0"
        style={{
          zIndex: 99999,
          isolation: 'isolate',
          transform: 'translate3d(0,0,0)',
          WebkitTransform: 'translate3d(0,0,0)',
          willChange: 'transform',
          pointerEvents: 'auto',
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
              {/* Header */}
              <div className="sticky top-0 bg-background z-10 rounded-t-3xl overflow-hidden">
                <div className="h-0.5 bg-gradient-to-r from-primary via-primary/70 to-transparent" />
                <div className="px-5 pt-5 pb-4 border-b border-border/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg tracking-tight">Get Pricing & Floor Plans</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{projectName}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full hover:bg-muted -mr-1"
                      onClick={() => setIsExpanded(false)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>

              {!isSuccess ? (
                <div className="p-5 pb-8">
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <Label htmlFor="mobile-fullName" className="text-xs font-semibold text-foreground/80">
                        Full Name
                      </Label>
                      <Input
                        id="mobile-fullName"
                        placeholder="John Smith"
                        autoComplete="name"
                        autoCapitalize="words"
                        {...form.register("fullName")}
                        className="h-12 text-[16px] rounded-lg border border-border bg-background shadow-[inset_0_1px_2px_hsl(var(--foreground)/0.04)] placeholder:text-muted-foreground/40 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <Label htmlFor="mobile-email" className="text-xs font-semibold text-foreground/80">
                        Email
                      </Label>
                      <Input
                        id="mobile-email"
                        type="email"
                        inputMode="email"
                        placeholder="john@email.com"
                        autoComplete="email"
                        autoCapitalize="none"
                        {...form.register("email")}
                        className="h-12 text-[16px] rounded-lg border border-border bg-background shadow-[inset_0_1px_2px_hsl(var(--foreground)/0.04)] placeholder:text-muted-foreground/40 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                      />
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5">
                      <Label htmlFor="mobile-phone" className="text-xs font-semibold text-foreground/80">
                        Phone
                      </Label>
                      <Input
                        id="mobile-phone"
                        type="tel"
                        inputMode="tel"
                        placeholder="(604) 555-0123"
                        autoComplete="tel"
                        {...form.register("phone")}
                        className="h-12 text-[16px] rounded-lg border border-border bg-background shadow-[inset_0_1px_2px_hsl(var(--foreground)/0.04)] placeholder:text-muted-foreground/40 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                      />
                    </div>

                    {/* I'm a Realtor checkbox */}
                    <div className="flex items-center gap-3 pt-0.5">
                      <Checkbox
                        id="mobile-isRealtor"
                        checked={form.watch("isRealtor")}
                        onCheckedChange={(checked) => form.setValue("isRealtor", checked === true)}
                        className="h-[18px] w-[18px] rounded border-border/80 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-colors"
                      />
                      <Label htmlFor="mobile-isRealtor" className="text-sm text-foreground/70 cursor-pointer select-none">
                        I'm a Realtor
                      </Label>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-13 font-semibold text-[15px] rounded-lg shadow-gold hover:shadow-gold-glow transition-all mt-2" 
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

                    {/* Trust line */}
                    <p className="text-center text-[10px] text-muted-foreground/60 pt-1">
                      <span className="text-primary/70">✓</span> Instant access · No spam
                    </p>
                  </form>
                </div>
              ) : (
                <div className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-2xl mb-4">
                    <CheckCircle className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-1.5">Request Sent!</h3>
                  <p className="text-sm text-muted-foreground mb-5">
                    Check your email for floor plans and pricing details.
                  </p>
                  {successWhatsappLink && (
                    <Button asChild variant="outline" className="w-full h-12 rounded-lg mb-3 font-semibold">
                      <a href={successWhatsappLink} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Chat on WhatsApp
                      </a>
                    </Button>
                  )}
                  <Button variant="ghost" className="w-full h-11 rounded-lg text-muted-foreground" onClick={() => setIsExpanded(false)}>
                    Close
                  </Button>
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
                <a href="tel:+16722581100" aria-label="Call agent">
                  <Phone className="h-5 w-5" />
                </a>
              </Button>

              {whatsappLink && (
                <Button variant="outline" size="icon" className="shrink-0 h-12 w-12 min-w-[48px] min-h-[48px] rounded-xl text-primary border-border hover:bg-accent touch-active" asChild>
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp">
                    <MessageCircle className="h-5 w-5" />
                  </a>
                </Button>
              )}

              <Button 
                size="lg"
                className="flex-1 h-14 min-h-[56px] rounded-xl font-semibold text-base gap-2 bg-foreground hover:bg-foreground/90 text-background touch-active"
                onClick={isExpanded ? () => setIsExpanded(false) : () => setIsExpanded(true)}
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