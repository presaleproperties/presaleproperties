import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle, Download, MessageCircle, X, ExternalLink, FileText, LayoutGrid, DollarSign } from "lucide-react";
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
import { useIsMobile } from "@/hooks/use-mobile";

const phoneRegex = /^[\+]?[1]?[-.\s]?[(]?[0-9]{3}[)]?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/;

// Full schema for desktop / step 2
const leadSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(50),
  lastName: z.string().trim().min(1, "Last name is required").max(50),
  email: z.string().trim().email("Please enter a valid email").max(255),
  phone: z.string().trim().min(1, "Phone is required").regex(phoneRegex, "Enter a valid phone number"),
  persona: z.enum(["first_time", "investor"]),
  workingWithAgent: z.enum(["no", "yes", "i_am_realtor"]),
  homeSize: z.enum(["1_bed", "2_bed", "3_bed_plus"]),
});

// Minimal schema for mobile step 1 (email only)
const emailOnlySchema = z.object({
  email: z.string().trim().email("Please enter a valid email").max(255),
});

// Profile schema for mobile step 2 (first name only, no last name)
const profileSchema = z.object({
  firstName: z.string().trim().max(50).optional(),
  phone: z.string().trim().optional().refine(val => !val || phoneRegex.test(val), "Enter a valid phone number"),
  persona: z.enum(["first_time", "investor"]).optional(),
  workingWithAgent: z.enum(["no", "yes", "i_am_realtor"]).optional(),
  homeSize: z.enum(["1_bed", "2_bed", "3_bed_plus"]).optional(),
});

type LeadFormData = z.infer<typeof leadSchema>;
type EmailOnlyData = z.infer<typeof emailOnlySchema>;
type ProfileData = z.infer<typeof profileSchema>;

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

export function ProjectLeadForm({ projectId, projectName, status, brochureUrl, floorplanUrl, pricingUrl, leadSource = "floor_plan_request", onClose }: ProjectLeadFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState<string>("16722581100");
  const [formStartTracked, setFormStartTracked] = useState(false);
  
  // Mobile 2-step flow state
  const [mobileStep, setMobileStep] = useState<1 | 2 | "complete">(1);
  const [submittedEmail, setSubmittedEmail] = useState<string>("");
  const [leadId, setLeadId] = useState<string>("");
  
  const { toast } = useToast();
  const isMobile = useIsMobile();

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

  // Desktop form
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

  // Mobile Step 1 form (email only)
  const emailForm = useForm<EmailOnlyData>({
    resolver: zodResolver(emailOnlySchema),
    defaultValues: {
      email: "",
    },
  });

  // Mobile Step 2 form (first name only, no last name)
  const profileForm = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
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

  // Common function to submit lead data
  const submitLeadToBackend = async (data: {
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    persona?: string;
    workingWithAgent?: string;
    homeSize?: string;
    source: string;
  }) => {
    const fullName = data.firstName && data.lastName 
      ? `${data.firstName} ${data.lastName}`.trim() 
      : data.firstName || "";
    
    const messageData = [
      data.firstName ? `First Name: ${data.firstName}` : "",
      data.lastName ? `Last Name: ${data.lastName}` : "",
      data.persona ? `Persona: ${PERSONAS.find(p => p.value === data.persona)?.label}` : "",
      data.workingWithAgent ? `Working with Agent: ${AGENT_OPTIONS.find(a => a.value === data.workingWithAgent)?.label}` : "",
      data.homeSize ? `Home Size: ${HOME_SIZES.find(h => h.value === data.homeSize)?.label}` : "",
    ].filter(Boolean).join(" | ");

    const nextDripAt = new Date().toISOString();
    const dripSequence = data.persona === "investor" ? "investor" : "buyer";
    const actualPersona = data.workingWithAgent === "i_am_realtor" ? "realtor" : (data.persona || "first_time");

    // Get UTM tracking data
    const utmData = getUtmDataForSubmission();

    // Get visitor tracking data for Zapier enrichment
    const visitorId = getVisitorId();
    const sessionId = getSessionId();
    const intentScore = getIntentScore();
    const cityInterest = getCityInterests();
    const projectInterest = getTopViewedProjects().map(p => p.project_id);

    // Avoid selecting the inserted row (keeps lead data private under RLS)
    const newLeadId = crypto.randomUUID();

    const { error } = await supabase
      .from("project_leads")
      .insert([
        {
          id: newLeadId,
          project_id: projectId,
          name: fullName,
          email: data.email,
          phone: data.phone || null,
          message: messageData || null,
          persona: actualPersona,
          home_size: data.homeSize || "2_bed",
          agent_status: data.workingWithAgent || "no",
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
          lead_source: data.source,
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
            first_name: data.firstName || "",
            last_name: data.lastName || "",
            project_name: projectName,
            project_id: projectId,
          },
          meta: { lead_id: newLeadId, source: data.source },
        },
      })
      .catch(console.error);

    supabase.functions
      .invoke("send-project-lead", { body: { leadId: newLeadId } })
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

    return newLeadId;
  };

  // Desktop full form submit
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
      await submitLeadToBackend({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        persona: data.persona,
        workingWithAgent: data.workingWithAgent,
        homeSize: data.homeSize,
        source: leadSource,
      });

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

  // Mobile Step 1: Capture email immediately and proceed to step 2
  const onEmailSubmit = async (data: EmailOnlyData) => {
    setIsSubmitting(true);
    handleFormInteraction();

    trackCTAClick({
      cta_type: "lead_form_step1",
      cta_label: "Continue - Step 1",
      cta_location: "project_lead_form_mobile",
      project_id: projectId,
      project_name: projectName,
    });

    try {
      // Submit email immediately to capture the lead
      const newLeadId = await submitLeadToBackend({
        email: data.email,
        firstName: "",
        lastName: "",
        phone: "",
        persona: "first_time",
        workingWithAgent: "no",
        homeSize: "2_bed",
        source: `${leadSource}_step1`, // Mark as step 1 only
      });

      setSubmittedEmail(data.email);
      setLeadId(newLeadId);
      setMobileStep(2);
    } catch (error: any) {
      console.error("Error capturing email:", error);
      toast({
        title: "Something went wrong",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mobile Step 2: Update lead with full profile (triggers floor plan email)
  const onProfileSubmit = async (data: ProfileData) => {
    setIsSubmitting(true);

    trackCTAClick({
      cta_type: "lead_form_submit",
      cta_label: "Get Floor Plans - Step 2",
      cta_location: "project_lead_form_mobile",
      project_id: projectId,
      project_name: projectName,
    });

    // Track form submission with new behavioral tracking
    trackFormSubmit({
      form_name: leadSource === "floor_plan_request" ? "floor_plan_request" : "project_inquiry",
      form_location: "project_lead_form_mobile",
      first_name: data.firstName || "",
      last_name: "", // No last name in mobile flow
      email: submittedEmail,
      phone: data.phone || "",
      user_type: data.workingWithAgent === "i_am_realtor" ? "realtor" : data.persona === "investor" ? "investor" : "buyer",
      project_id: projectId,
      project_name: projectName,
    });

    try {
      const fullName = data.firstName?.trim() || "";
      const actualPersona = data.workingWithAgent === "i_am_realtor" ? "realtor" : (data.persona || "first_time");
      const dripSequence = data.persona === "investor" ? "investor" : "buyer";

      const messageData = [
        data.firstName ? `First Name: ${data.firstName}` : "",
        data.persona ? `Persona: ${PERSONAS.find(p => p.value === data.persona)?.label}` : "",
        data.workingWithAgent ? `Working with Agent: ${AGENT_OPTIONS.find(a => a.value === data.workingWithAgent)?.label}` : "",
        data.homeSize ? `Home Size: ${HOME_SIZES.find(h => h.value === data.homeSize)?.label}` : "",
      ].filter(Boolean).join(" | ");

      // Update existing lead record with profile info
      const { error } = await supabase
        .from("project_leads")
        .update({
          name: fullName,
          phone: data.phone || null,
          message: messageData || null,
          persona: actualPersona,
          home_size: data.homeSize || "2_bed",
          agent_status: data.workingWithAgent || "no",
          drip_sequence: dripSequence,
          lead_source: leadSource, // Update to full source (remove _step1 suffix)
        })
        .eq("id", leadId);

      if (error) throw error;

      // Now trigger the floor plan email workflow (only after profile completed)
      supabase.functions
        .invoke("trigger-workflow", {
          body: {
            event: "project_inquiry",
            data: {
              email: submittedEmail,
              first_name: data.firstName || "",
              last_name: "",
              project_name: projectName,
              project_id: projectId,
            },
            meta: { lead_id: leadId, source: leadSource },
          },
        })
        .catch(console.error);

      // Send updated lead to Zapier with full profile data
      supabase.functions
        .invoke("send-project-lead", { body: { leadId } })
        .catch(console.error);

      // Send server-side Lead event to Meta Conversions API
      supabase.functions
        .invoke("meta-conversions-api", {
          body: {
            event_name: "Lead",
            email: submittedEmail,
            phone: data.phone,
            first_name: data.firstName,
            last_name: "",
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

      setMobileStep("complete");
      toast({
        title: status === "coming_soon" ? "You're on the list!" : "Request submitted!",
        description: "Check your email for floor plans & pricing.",
      });
    } catch (error: any) {
      console.error("Error updating lead:", error);
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

  // Final success state (both desktop and mobile complete)
  if (isSubmitted || mobileStep === "complete") {
    // Helper to check if a URL is valid (not null, undefined, or empty/whitespace)
    const hasValidUrl = (url: string | null | undefined): url is string => 
      Boolean(url && url.trim().length > 0);
    
    const hasBrochure = hasValidUrl(brochureUrl);
    const hasFloorplan = hasValidUrl(floorplanUrl);
    const hasPricing = hasValidUrl(pricingUrl);
    const hasAnyDocuments = hasBrochure || hasFloorplan || hasPricing;
    
    const isGoogleDriveLink = (url: string) => url.includes('drive.google.com') || url.includes('docs.google.com');
    
    return (
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
        <div className="bg-gradient-to-br from-foreground via-foreground to-foreground/85 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-500/20 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-background">You're All Set!</h3>
              <p className="text-sm text-background/70">
                {hasAnyDocuments ? "Access your documents below." : "Check your email for pricing & floor plans."}
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-5 space-y-3">
          {/* Document Access Section - Only show if at least one document exists */}
          {hasAnyDocuments && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Your Documents</p>
              
              {hasFloorplan && (
                <Button
                  asChild
                  size="lg"
                  className="w-full h-12 text-sm font-semibold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <a 
                    href={floorplanUrl!} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <LayoutGrid className="h-4 w-4 mr-2" />
                    {isGoogleDriveLink(floorplanUrl!) ? "View Floor Plans" : "Download Floor Plans"}
                    {isGoogleDriveLink(floorplanUrl!) && <ExternalLink className="h-3 w-3 ml-1.5" />}
                  </a>
                </Button>
              )}

              {hasPricing && (
                <Button
                  asChild
                  size="lg"
                  variant={hasFloorplan ? "outline" : "default"}
                  className="w-full h-12 text-sm font-semibold rounded-xl"
                >
                  <a 
                    href={pricingUrl!} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    {isGoogleDriveLink(pricingUrl!) ? "View Pricing Sheet" : "Download Pricing"}
                    {isGoogleDriveLink(pricingUrl!) && <ExternalLink className="h-3 w-3 ml-1.5" />}
                  </a>
                </Button>
              )}

              {hasBrochure && (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full h-12 text-sm font-semibold rounded-xl"
                >
                  <a 
                    href={brochureUrl!} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
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

  const getFormContent = () => {
    switch (status) {
      case "coming_soon":
        return {
          title: "Get Early Access to Floor Plans & Pricing",
          buttonText: "Download Info",
        };
      case "registering":
        return {
          title: "Register for VIP Access",
          buttonText: "Download Info",
        };
      case "active":
        return {
          title: "Get Floor Plans & Pricing",
          buttonText: "Download Info",
        };
      default:
        return {
          title: "Get Notified of Similar Projects",
          buttonText: "Download Info",
        };
    }
  };

  const content = getFormContent();

  // ========================================
  // MOBILE STEP 2: Required Profiling Form
  // ========================================
  if (isMobile && mobileStep === 2) {
    return (
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl relative">
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute right-3 top-3 z-10 p-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Progress Banner */}
        <div className="bg-gradient-to-br from-foreground via-foreground to-foreground/85 px-5 py-4 pr-12">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-background bg-primary/90 px-2.5 py-1 rounded-full">
              Step 2 of 2
            </span>
          </div>
          <h3 className="text-lg font-bold text-background leading-snug">
            Almost there!
          </h3>
          <p className="text-xs text-background/70 mt-1">
            Complete your profile to receive floor plans at <span className="font-medium">{submittedEmail}</span>
          </p>
        </div>

        {/* Required Profiling Form */}
        <div className="p-5 bg-card">
          <p className="text-sm text-muted-foreground mb-4">
            Tell us a bit about yourself so we can personalize your floor plans package.
          </p>

          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
            {/* First Name Only */}
            <div>
              <Label htmlFor="profile-firstName" className="text-sm font-medium text-muted-foreground mb-1.5 block">
                First Name
              </Label>
              <Input
                id="profile-firstName"
                placeholder="John"
                autoComplete="given-name"
                autoCapitalize="words"
                {...profileForm.register("firstName")}
                className="h-12 min-h-[48px] text-[16px] rounded-lg border-border focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="profile-phone" className="text-sm font-medium text-muted-foreground mb-1.5 block">
                Phone
              </Label>
              <Input
                id="profile-phone"
                type="tel"
                inputMode="tel"
                placeholder="604-555-0123"
                autoComplete="tel"
                {...profileForm.register("phone")}
                className="h-12 min-h-[48px] text-[16px] rounded-lg border-border focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* I am a... */}
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                I am a...
              </Label>
              <RadioGroup
                value={profileForm.watch("persona")}
                onValueChange={(v) => profileForm.setValue("persona", v as any)}
                className="grid grid-cols-2 gap-3"
              >
                {PERSONAS.map((p) => (
                  <Label
                    key={p.value}
                    className={`flex items-center justify-center h-12 min-h-[48px] rounded-xl border-2 cursor-pointer text-base font-medium transition-all touch-active ${
                      profileForm.watch("persona") === p.value
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

            {/* Working with a Realtor? */}
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                Working with a Realtor?
              </Label>
              <RadioGroup
                value={profileForm.watch("workingWithAgent")}
                onValueChange={(v) => profileForm.setValue("workingWithAgent", v as any)}
                className="grid grid-cols-3 gap-2"
              >
                {AGENT_OPTIONS.map((a) => (
                  <Label
                    key={a.value}
                    className={`flex items-center justify-center h-11 min-h-[44px] rounded-xl border-2 cursor-pointer text-sm font-medium transition-all text-center px-2 touch-active ${
                      profileForm.watch("workingWithAgent") === a.value
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

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-14 min-h-[56px] text-base font-bold rounded-xl gap-2 shadow-lg hover:shadow-xl transition-all touch-active bg-primary hover:bg-primary/90"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Sending...
                </span>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download Info
                
                </>
              )}
            </Button>

            {/* Trust indicators */}
            <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground pt-1">
              <span className="flex items-center gap-1">
                <span className="text-green-500">✓</span> No spam
              </span>
              <span className="flex items-center gap-1">
                <span className="text-green-500">✓</span> Same-day response
              </span>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ========================================
  // MOBILE STEP 1: Email Only Form
  // ========================================
  if (isMobile && mobileStep === 1) {
    return (
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-elevated hover:shadow-premium transition-shadow duration-300 relative">
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
        <div className="bg-gradient-to-br from-foreground via-foreground to-foreground/85 px-5 py-5 pr-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
          
          {brochureUrl && (
            <div className="flex items-center gap-2 flex-wrap mb-2 relative">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-white bg-green-500/90 px-2.5 py-1 rounded-full shadow-sm">
                <Download className="h-3 w-3" />
                Brochure Ready
              </span>
            </div>
          )}
          
          <h3 className="text-lg font-bold text-background leading-snug relative">
            {content.title}
          </h3>
          <p className="text-xs text-background/70 mt-1 relative">
            Get instant access — no obligation
          </p>
        </div>

        {/* Email-only Form */}
        <div className="p-5 bg-card">
          <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} onFocus={handleFormInteraction} className="space-y-4">
            <div>
              <Label htmlFor="mobile-email" className="text-sm font-medium text-muted-foreground mb-1.5 block">
                Email
              </Label>
              <Input
                id="mobile-email"
                type="email"
                inputMode="email"
                placeholder="john@email.com"
                autoComplete="email"
                autoCapitalize="none"
                enterKeyHint="send"
                {...emailForm.register("email")}
                className="h-14 min-h-[56px] text-[16px] rounded-lg border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {emailForm.formState.errors.email && (
                <p className="text-sm text-destructive mt-1">{emailForm.formState.errors.email.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-14 min-h-[56px] text-lg font-bold rounded-xl gap-2 shadow-lg hover:shadow-xl transition-all touch-active bg-primary hover:bg-primary/90"
              size="lg"
            >
              <Download className="h-5 w-5" />
              Download Info
            </Button>

            {/* Trust indicators */}
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-1">
              <span className="flex items-center gap-1">
                <span className="text-green-500">✓</span> No spam
              </span>
              <span className="flex items-center gap-1">
                <span className="text-green-500">✓</span> Same-day response
              </span>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ========================================
  // DESKTOP: Compact Full Form (no scroll)
  // ========================================
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-elevated hover:shadow-premium transition-shadow duration-300 relative">
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
      
      {/* Header - Compact premium gradient */}
      <div className="bg-gradient-to-br from-foreground via-foreground to-foreground/85 px-4 py-3 pr-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
        
        {/* Brochure Ready indicator */}
        {brochureUrl && (
          <div className="flex items-center gap-2 flex-wrap mb-1 relative">
            <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-white bg-green-500/90 px-2 py-0.5 rounded-full">
              <Download className="h-2.5 w-2.5" />
              Brochure Ready
            </span>
          </div>
        )}
        
        <h3 className="text-base lg:text-lg font-bold text-background leading-tight relative">
          {content.title}
        </h3>
        <p className="text-[10px] text-background/70 mt-0.5 relative">
          Get instant access — no obligation
        </p>
      </div>

      {/* Form - Compact layout for desktop without scrolling */}
      <div className="p-4 bg-card">
        <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} onFocus={handleFormInteraction} className="space-y-3">
          {/* First Name & Last Name - side by side */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="lead-firstName" className="text-xs font-medium text-muted-foreground mb-1 block">
                First Name
              </Label>
              <Input
                id="lead-firstName"
                name="fname"
                placeholder="John"
                autoComplete="given-name"
                autoCapitalize="words"
                enterKeyHint="next"
                {...form.register("firstName")}
                className="h-10 text-sm rounded-lg border-border focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <Label htmlFor="lead-lastName" className="text-xs font-medium text-muted-foreground mb-1 block">
                Last Name
              </Label>
              <Input
                id="lead-lastName"
                name="lname"
                placeholder="Smith"
                autoComplete="family-name"
                autoCapitalize="words"
                enterKeyHint="next"
                {...form.register("lastName")}
                className="h-10 text-sm rounded-lg border-border focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Email & Phone - side by side on desktop */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="lead-email" className="text-xs font-medium text-muted-foreground mb-1 block">
                Email
              </Label>
              <Input
                id="lead-email"
                name="email"
                type="email"
                inputMode="email"
                placeholder="john@email.com"
                autoComplete="email"
                autoCapitalize="none"
                enterKeyHint="next"
                {...form.register("email")}
                className="h-10 text-sm rounded-lg border-border focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <Label htmlFor="lead-phone" className="text-xs font-medium text-muted-foreground mb-1 block">
                Phone
              </Label>
              <Input
                id="lead-phone"
                name="phone"
                type="tel"
                inputMode="tel"
                placeholder="604-555-0123"
                autoComplete="tel"
                enterKeyHint="done"
                {...form.register("phone")}
                className="h-10 text-sm rounded-lg border-border focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* I am a... - Compact buttons */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              I am a...
            </Label>
            <RadioGroup
              value={form.watch("persona")}
              onValueChange={(v) => form.setValue("persona", v as any)}
              className="grid grid-cols-2 gap-2"
            >
              {PERSONAS.map((p) => (
                <Label
                  key={p.value}
                  className={`flex items-center justify-center h-9 rounded-lg border-2 cursor-pointer text-sm font-medium transition-all ${
                    form.watch("persona") === p.value
                      ? "border-foreground bg-foreground text-background"
                      : "border-border hover:border-muted-foreground/50"
                  }`}
                >
                  <RadioGroupItem value={p.value} className="sr-only" />
                  {p.label}
                </Label>
              ))}
            </RadioGroup>
          </div>

          {/* Working with Realtor - full width */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
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
                  className={`flex items-center justify-center h-9 rounded-lg border-2 cursor-pointer text-xs font-medium transition-all ${
                    form.watch("workingWithAgent") === a.value
                      ? "border-foreground bg-foreground text-background"
                      : "border-border hover:border-muted-foreground/50"
                  }`}
                >
                  <RadioGroupItem value={a.value} className="sr-only" />
                  {a.label}
                </Label>
              ))}
            </RadioGroup>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-11 text-sm font-bold rounded-xl gap-2 shadow-lg hover:shadow-xl transition-all bg-primary hover:bg-primary/90"
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

          {/* Trust indicators & Disclaimer combined */}
          <p className="text-[9px] leading-relaxed text-muted-foreground text-center">
            <span className="text-green-500">✓</span> No spam • <span className="text-green-500">✓</span> Same-day response<br/>
            By submitting, you agree to our{" "}
            <a href="/privacy" className="underline hover:text-foreground">Privacy Policy</a>.
          </p>
        </form>
      </div>
    </div>
  );
}
