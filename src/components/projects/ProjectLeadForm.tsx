import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send, CheckCircle, Download, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getUtmDataForSubmission } from "@/hooks/useUtmTracking";
import { trackCTAClick } from "@/hooks/useLoftyTracking";
import { trackFormStart, trackFormSubmit, getVisitorId, getSessionId } from "@/lib/tracking";
import { getIntentScore, getCityInterests, getTopViewedProjects } from "@/lib/tracking/intentScoring";

const phoneRegex = /^[\+]?[1]?[-.\s]?[(]?[0-9]{3}[)]?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/;

const leadSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(50),
  lastName: z.string().trim().min(1, "Last name is required").max(50),
  email: z.string().trim().email("Please enter a valid email").max(255),
  phone: z.string().trim().min(1, "Phone is required").regex(phoneRegex, "Enter a valid phone number"),
  persona: z.enum(["first_time", "investor"]),
  workingWithAgent: z.enum(["no", "yes", "i_am_realtor"]),
  homeSize: z.enum(["1_bed", "2_bed", "3_bed_plus"]),
});

type LeadFormData = z.infer<typeof leadSchema>;

interface ProjectLeadFormProps {
  projectId: string;
  projectName: string;
  status: "coming_soon" | "registering" | "active" | "sold_out";
  brochureUrl?: string | null;
  leadSource?: "floor_plan_request" | "general_inquiry" | "scheduler";
  onClose?: () => void;
}

const PERSONAS = [
  { value: "first_time", label: "First-time Buyer" },
  { value: "investor", label: "Investor" },
];

const AGENT_OPTIONS = [
  { value: "no", label: "No" },
  { value: "yes", label: "Yes" },
  { value: "i_am_realtor", label: "I'm a Realtor" },
];

const HOME_SIZES = [
  { value: "1_bed", label: "1 Bed" },
  { value: "2_bed", label: "2 Bed" },
  { value: "3_bed_plus", label: "3 Bed+" },
];

export function ProjectLeadForm({ projectId, projectName, status, brochureUrl, leadSource = "floor_plan_request", onClose }: ProjectLeadFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState<string>("16722581100");
  const [formStartTracked, setFormStartTracked] = useState(false);
  const { toast } = useToast();

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

  // Track form start on first interaction
  const handleFormInteraction = () => {
    if (!formStartTracked) {
      setFormStartTracked(true);
      trackFormStart({
        form_name: leadSource === "floor_plan_request" ? "floor_plan_request" : "project_inquiry",
        form_location: "project_lead_form",
      });
    }
  };

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      persona: "first_time",
      workingWithAgent: "no",
      homeSize: "2_bed",
    },
  });

  const onInvalid = () => {
    toast({
      title: "Please complete the form",
      description: "All fields are required.",
      variant: "destructive",
    });
  };

  const onSubmit = async (data: LeadFormData) => {
    setIsSubmitting(true);

    // Track form submission CTA click (legacy)
    trackCTAClick({
      cta_type: "lead_form_submit",
      cta_label: leadSource === "floor_plan_request" ? "Get Pricing & Floor Plans" : "Submit Inquiry",
      cta_location: "project_lead_form",
      project_id: projectId,
      project_name: projectName,
    });

    // Track form submission with new behavioral tracking
    trackFormSubmit({
      form_name: leadSource === "floor_plan_request" ? "floor_plan_request" : "project_inquiry",
      form_location: "project_lead_form",
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      phone: data.phone,
      user_type: data.workingWithAgent === "i_am_realtor" ? "realtor" : data.persona === "investor" ? "investor" : "buyer",
      project_id: projectId,
      project_name: projectName,
    });

    try {
      const fullName = `${data.firstName} ${data.lastName}`.trim();
      const messageData = [
        `First Name: ${data.firstName}`,
        `Last Name: ${data.lastName}`,
        `Persona: ${PERSONAS.find(p => p.value === data.persona)?.label}`,
        `Working with Agent: ${AGENT_OPTIONS.find(a => a.value === data.workingWithAgent)?.label}`,
        `Home Size: ${HOME_SIZES.find(h => h.value === data.homeSize)?.label}`,
      ].join(" | ");

      const nextDripAt = new Date().toISOString();
      const dripSequence = data.persona === "investor" ? "investor" : "buyer";
      const actualPersona = data.workingWithAgent === "i_am_realtor" ? "realtor" : data.persona;

      // Get UTM tracking data
      const utmData = getUtmDataForSubmission();

      // Get visitor tracking data for Zapier enrichment
      const visitorId = getVisitorId();
      const sessionId = getSessionId();
      const intentScore = getIntentScore();
      const cityInterest = getCityInterests();
      const projectInterest = getTopViewedProjects().map(p => p.project_id);

      // Avoid selecting the inserted row (keeps lead data private under RLS)
      const leadId = crypto.randomUUID();

      const { error } = await supabase
        .from("project_leads")
        .insert([
          {
            id: leadId,
            project_id: projectId,
            name: fullName,
            email: data.email,
            phone: data.phone,
            message: messageData,
            persona: actualPersona,
            home_size: data.homeSize,
            agent_status: data.workingWithAgent,
            drip_sequence: dripSequence,
            last_drip_sent: 0,
            next_drip_at: nextDripAt,
            utm_source: utmData.utm_source,
            utm_medium: utmData.utm_medium,
            utm_campaign: utmData.utm_campaign,
            utm_content: utmData.utm_content,
            utm_term: utmData.utm_term,
            referrer: utmData.referrer,
            landing_page: utmData.landing_page,
            lead_source: leadSource,
            // Visitor tracking for Zapier enrichment
            visitor_id: visitorId,
            session_id: sessionId,
            intent_score: intentScore,
            city_interest: cityInterest,
            project_interest: projectInterest,
          },
        ]);

      if (error) throw error;

      // Trigger email workflow for project inquiry
      supabase.functions
        .invoke("trigger-workflow", {
          body: {
            event: "project_inquiry",
            data: {
              email: data.email,
              first_name: data.firstName,
              last_name: data.lastName,
              project_name: projectName,
              project_id: projectId,
            },
            meta: { lead_id: leadId, source: leadSource },
          },
        })
        .catch(console.error);

      supabase.functions
        .invoke("send-project-lead", { body: { leadId } })
        .catch(console.error);

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
            content_name: projectName,
            content_category: actualPersona,
            client_user_agent: navigator.userAgent,
            fbc: document.cookie.match(/_fbc=([^;]+)/)?.[1],
            fbp: document.cookie.match(/_fbp=([^;]+)/)?.[1],
          },
        })
        .catch((err) => console.error("Meta CAPI error:", err));

      localStorage.setItem("presale_persona", actualPersona);
      localStorage.setItem("pp_form_submitted", "true");
      localStorage.setItem("presale_lead_converted", "true");

      // Analytics tracking
      if (typeof window !== "undefined") {
        if ((window as any).gtag) {
          (window as any).gtag("event", "submit_access_pack", {
            page_path: window.location.pathname,
            project_name: projectName,
            persona: actualPersona,
            home_size: data.homeSize,
            working_with_agent: data.workingWithAgent,
            source: "project_lead_form",
          });
        }
        if ((window as any).fbq) {
          (window as any).fbq("track", "Lead", {
            content_name: projectName,
            content_category: actualPersona,
          });
        }
      }

      setIsSubmitted(true);
      form.reset();
      toast({
        title: status === "coming_soon" ? "You're on the list!" : "Request submitted!",
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

  const whatsappMessage = encodeURIComponent(`Hi! I just submitted my info for ${projectName} and would love to learn more.`);
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  if (isSubmitted) {
    return (
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
        <div className="bg-gradient-to-br from-foreground via-foreground to-foreground/85 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-500/20 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-background">You're All Set!</h3>
              <p className="text-sm text-background/70">Check your email for pricing & floor plans.</p>
            </div>
          </div>
        </div>
        
        <div className="p-5 space-y-3">
          {brochureUrl && (
            <Button
              asChild
              size="lg"
              className="w-full h-14 text-base font-semibold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <a href={brochureUrl} target="_blank" rel="noopener noreferrer" download>
                <Download className="h-5 w-5 mr-2" />
                Download Brochure
              </a>
            </Button>
          )}
          
          <Button
            asChild
            size="lg"
            variant={brochureUrl ? "outline" : "default"}
            className={`w-full h-14 text-base font-semibold rounded-xl ${!brochureUrl ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
          >
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-5 w-5 mr-2" />
              Chat with an Agent Now
            </a>
          </Button>
        </div>
      </div>
    );
  }

  const getFormContent = () => {
    switch (status) {
      case "coming_soon":
        return {
          title: "Get Early Access to Floor Plans & Pricing",
          buttonText: "Get Early Access",
        };
      case "registering":
        return {
          title: "Register for VIP Access",
          buttonText: "Register Now",
        };
      case "active":
        return {
          title: "Get Floor Plans & Pricing",
          buttonText: "Get Instant Access",
        };
      default:
        return {
          title: "Get Notified of Similar Projects",
          buttonText: "Notify Me",
        };
    }
  };

  const content = getFormContent();

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl relative">
      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 p-1 text-white/70 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      )}
      
      {/* Header */}
      <div className="bg-gradient-to-br from-foreground via-foreground to-foreground/85 px-5 py-4 pr-12">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          {brochureUrl && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-green-500/90 px-2.5 py-1 rounded-full">
              <Download className="h-3 w-3" />
              Brochure Available
            </span>
          )}
        </div>
        <h3 className="text-lg font-bold text-background leading-snug">
          {content.title}
        </h3>
      </div>

      {/* Form - optimized for conversion & mobile UX */}
      <div className="p-4 bg-card">
        <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} onFocus={handleFormInteraction} className="space-y-4">
          {/* First Name & Last Name - side by side with proper touch targets */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="lead-firstName" className="text-sm font-medium text-muted-foreground mb-1.5 block">
                First Name
              </Label>
              <Input
                id="lead-firstName"
                placeholder="John"
                autoComplete="given-name"
                enterKeyHint="next"
                {...form.register("firstName")}
                className="h-12 min-h-[48px] text-base rounded-lg border-border focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <Label htmlFor="lead-lastName" className="text-sm font-medium text-muted-foreground mb-1.5 block">
                Last Name
              </Label>
              <Input
                id="lead-lastName"
                placeholder="Smith"
                autoComplete="family-name"
                enterKeyHint="next"
                {...form.register("lastName")}
                className="h-12 min-h-[48px] text-base rounded-lg border-border focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Email - auto-complete friendly */}
          <div>
            <Label htmlFor="lead-email" className="text-sm font-medium text-muted-foreground mb-1.5 block">
              Email
            </Label>
            <Input
              id="lead-email"
              type="email"
              inputMode="email"
              placeholder="john@email.com"
              autoComplete="email"
              enterKeyHint="next"
              {...form.register("email")}
              className="h-12 min-h-[48px] text-base rounded-lg border-border focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Phone - numeric keyboard on mobile */}
          <div>
            <Label htmlFor="lead-phone" className="text-sm font-medium text-muted-foreground mb-1.5 block">
              Phone
            </Label>
            <Input
              id="lead-phone"
              type="tel"
              inputMode="tel"
              placeholder="604-555-0123"
              autoComplete="tel"
              enterKeyHint="done"
              {...form.register("phone")}
              className="h-12 min-h-[48px] text-base rounded-lg border-border focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* I am a... - Large touch targets */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground mb-2 block">
              I am a...
            </Label>
            <RadioGroup
              value={form.watch("persona")}
              onValueChange={(v) => form.setValue("persona", v as any)}
              className="grid grid-cols-2 gap-3"
            >
              {PERSONAS.map((p) => (
                <Label
                  key={p.value}
                  className={`flex items-center justify-center h-12 min-h-[48px] rounded-xl border-2 cursor-pointer text-base font-medium transition-all touch-active ${
                    form.watch("persona") === p.value
                      ? "border-foreground bg-foreground text-background"
                      : "border-border hover:border-muted-foreground/50 active:bg-muted"
                  }`}
                >
                  <RadioGroupItem value={p.value} className="sr-only" />
                  {p.label}
                </Label>
              ))}
            </RadioGroup>
          </div>

          {/* Working with agent - Touch-friendly */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground mb-2 block">
              Working with a Realtor?
            </Label>
            <RadioGroup
              value={form.watch("workingWithAgent")}
              onValueChange={(v) => form.setValue("workingWithAgent", v as any)}
              className="grid grid-cols-3 gap-2"
            >
              {AGENT_OPTIONS.map((a) => (
                <Label
                  key={a.value}
                  className={`flex items-center justify-center h-11 min-h-[44px] rounded-xl border-2 cursor-pointer text-sm font-medium transition-all text-center px-2 touch-active ${
                    form.watch("workingWithAgent") === a.value
                      ? "border-foreground bg-foreground text-background"
                      : "border-border hover:border-muted-foreground/50 active:bg-muted"
                  }`}
                >
                  <RadioGroupItem value={a.value} className="sr-only" />
                  {a.label}
                </Label>
              ))}
            </RadioGroup>
          </div>

          {/* Interested in Home Size - Touch-friendly */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground mb-2 block">
              Home Size
            </Label>
            <RadioGroup
              value={form.watch("homeSize")}
              onValueChange={(v) => form.setValue("homeSize", v as any)}
              className="grid grid-cols-3 gap-2"
            >
              {HOME_SIZES.map((size) => (
                <Label
                  key={size.value}
                  className={`flex items-center justify-center h-11 min-h-[44px] rounded-xl border-2 cursor-pointer text-sm font-medium transition-all touch-active ${
                    form.watch("homeSize") === size.value
                      ? "border-foreground bg-foreground text-background"
                      : "border-border hover:border-muted-foreground/50 active:bg-muted"
                  }`}
                >
                  <RadioGroupItem value={size.value} className="sr-only" />
                  {size.label}
                </Label>
              ))}
            </RadioGroup>
          </div>

          {/* Submit Button - Large touch target */}
          <Button
            type="submit"
            className="w-full h-14 min-h-[56px] text-base font-bold rounded-xl gap-2 shadow-md touch-active"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Submitting...
              </span>
            ) : (
              "Submit"
            )}
          </Button>

          {/* Optimized Disclaimer */}
          <p className="text-[10px] leading-relaxed text-muted-foreground text-center pt-1">
            By submitting, you agree to receive communications from PresaleProperties about this listing and similar properties. 
            This is not a condition of purchase. Message and data rates may apply. 
            View our{" "}
            <a href="/privacy" className="underline hover:text-foreground">
              Privacy Policy
            </a>.
          </p>
        </form>
      </div>
    </div>
  );
}
