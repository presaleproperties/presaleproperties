import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send, CheckCircle, Download, MessageCircle, X, ExternalLink, Mail } from "lucide-react";
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

// Profile schema for mobile step 2 (all optional except we validate what's filled)
const profileSchema = z.object({
  firstName: z.string().trim().max(50).optional(),
  lastName: z.string().trim().max(50).optional(),
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

  // Mobile Step 2 form (optional profiling)
  const profileForm = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
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

  // Mobile Step 1: Submit email only
  const onEmailSubmit = async (data: EmailOnlyData) => {
    setIsSubmitting(true);
    handleFormInteraction();

    trackCTAClick({
      cta_type: "lead_form_submit",
      cta_label: "Get Instant Access - Step 1",
      cta_location: "project_lead_form_mobile",
      project_id: projectId,
      project_name: projectName,
    });

    try {
      const newLeadId = await submitLeadToBackend({
        email: data.email,
        source: `${leadSource}_step1`,
      });

      setSubmittedEmail(data.email);
      setLeadId(newLeadId);
      setMobileStep(2);
      
      toast({
        title: "Check your email!",
        description: "Floor plans & pricing are on their way.",
      });
    } catch (error: any) {
      console.error("Error submitting email:", error);
      toast({
        title: "Submission failed",
        description: error?.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mobile Step 2: Submit profile (optional)
  const onProfileSubmit = async (data: ProfileData) => {
    setIsSubmitting(true);

    trackCTAClick({
      cta_type: "lead_form_submit",
      cta_label: "Complete Profile - Step 2",
      cta_location: "project_lead_form_mobile",
      project_id: projectId,
      project_name: projectName,
    });

    try {
      // Update the existing lead with additional profile data
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

      const actualPersona = data.workingWithAgent === "i_am_realtor" ? "realtor" : (data.persona || "first_time");
      const dripSequence = data.persona === "investor" ? "investor" : "buyer";

      // Update the lead record with profile data
      await supabase
        .from("project_leads")
        .update({
          name: fullName || undefined,
          phone: data.phone || undefined,
          message: messageData || undefined,
          persona: actualPersona,
          home_size: data.homeSize || "2_bed",
          agent_status: data.workingWithAgent || "no",
          drip_sequence: dripSequence,
          lead_source: `${leadSource}_step2_completed`,
        })
        .eq("id", leadId);

      // Trigger updated workflow
      supabase.functions
        .invoke("trigger-workflow", {
          body: {
            event: "project_inquiry",
            data: {
              email: submittedEmail,
              first_name: data.firstName || "",
              last_name: data.lastName || "",
              project_name: projectName,
              project_id: projectId,
            },
            meta: { lead_id: leadId, source: `${leadSource}_step2_completed` },
          },
        })
        .catch(console.error);

      localStorage.setItem("presale_persona", actualPersona);

      setMobileStep("complete");
      toast({
        title: "Profile complete!",
        description: "We'll personalize your experience based on your preferences.",
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update failed",
        description: error?.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Skip profile and show completion
  const handleSkipProfile = () => {
    setMobileStep("complete");
  };

  const whatsappMessage = encodeURIComponent(`Hi! I just submitted my info for ${projectName} and would love to learn more.`);
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  // Final success state (both desktop and mobile complete)
  if (isSubmitted || mobileStep === "complete") {
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
              <a 
                href={brochureUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                {...(!brochureUrl.includes('drive.google.com') && !brochureUrl.includes('docs.google.com') ? { download: true } : {})}
              >
                {brochureUrl.includes('drive.google.com') || brochureUrl.includes('docs.google.com') ? (
                  <>
                    <ExternalLink className="h-5 w-5 mr-2" />
                    View Brochure
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5 mr-2" />
                    Download Brochure
                  </>
                )}
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

  // ========================================
  // MOBILE STEP 2: Optional Profiling Form
  // ========================================
  if (isMobile && mobileStep === 2) {
    return (
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
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

        {/* Success Banner */}
        <div className="bg-green-50 dark:bg-green-950/30 border-b border-green-200 dark:border-green-800 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-green-500/20 rounded-full flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-green-800 dark:text-green-200">Check Your Email!</h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                Floor plans & pricing sent to: <span className="font-medium">{submittedEmail}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Optional Profiling Form */}
        <div className="p-5 bg-card">
          <p className="text-sm text-muted-foreground mb-4">
            Help us personalize your experience <span className="text-xs">(optional)</span>
          </p>

          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
            {/* First Name & Last Name */}
            <div className="grid grid-cols-2 gap-3">
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
              <div>
                <Label htmlFor="profile-lastName" className="text-sm font-medium text-muted-foreground mb-1.5 block">
                  Last Name
                </Label>
                <Input
                  id="profile-lastName"
                  placeholder="Smith"
                  autoComplete="family-name"
                  autoCapitalize="words"
                  {...profileForm.register("lastName")}
                  className="h-12 min-h-[48px] text-[16px] rounded-lg border-border focus:ring-2 focus:ring-primary/20"
                />
              </div>
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

            {/* Interested in */}
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                Interested in
              </Label>
              <RadioGroup
                value={profileForm.watch("homeSize")}
                onValueChange={(v) => profileForm.setValue("homeSize", v as any)}
                className="grid grid-cols-3 gap-2"
              >
                {HOME_SIZES.map((size) => (
                  <Label
                    key={size.value}
                    className={`flex items-center justify-center h-11 min-h-[44px] rounded-xl border-2 cursor-pointer text-sm font-medium transition-all touch-active ${
                      profileForm.watch("homeSize") === size.value
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

            {/* Buttons */}
            <div className="space-y-3 pt-2">
              <Button
                type="submit"
                className="w-full h-14 min-h-[56px] text-base font-bold rounded-xl gap-2 shadow-lg hover:shadow-xl transition-all touch-active bg-primary hover:bg-primary/90"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  "Complete Profile"
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleSkipProfile}
                className="w-full h-12 text-base font-medium rounded-xl border-border text-muted-foreground"
              >
                Skip
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              (We'll still send floor plans even if you skip this)
            </p>
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
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Sending...
                </span>
              ) : (
                <>
                  <Mail className="h-5 w-5" />
                  Get Instant Access
                </>
              )}
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
  // DESKTOP: Full Form (unchanged behavior)
  // ========================================
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-elevated hover:shadow-premium transition-shadow duration-300 relative lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto lg:overscroll-contain">
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
      
      {/* Header - Premium gradient with animated shine */}
      <div className="bg-gradient-to-br from-foreground via-foreground to-foreground/85 px-5 py-5 pr-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
        
        {/* Brochure Ready indicator */}
        {brochureUrl && (
          <div className="flex items-center gap-2 flex-wrap mb-2 relative">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-white bg-green-500/90 px-2.5 py-1 rounded-full shadow-sm">
              <Download className="h-3 w-3" />
              Brochure Ready
            </span>
          </div>
        )}
        
        <h3 className="text-lg lg:text-xl font-bold text-background leading-snug relative">
          {content.title}
        </h3>
        <p className="text-xs text-background/70 mt-1 relative">
          Get instant access — no obligation
        </p>
      </div>

      {/* Form - optimized for conversion & autofill */}
      <div className="p-4 lg:p-5 bg-card">
        <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} onFocus={handleFormInteraction} className="space-y-4">
          {/* First Name & Last Name - side by side with proper autofill */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="lead-firstName" className="text-sm font-medium text-muted-foreground mb-1.5 block">
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
                className="h-12 min-h-[48px] text-[16px] rounded-lg border-border focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <Label htmlFor="lead-lastName" className="text-sm font-medium text-muted-foreground mb-1.5 block">
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
                className="h-12 min-h-[48px] text-[16px] rounded-lg border-border focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="lead-email" className="text-sm font-medium text-muted-foreground mb-1.5 block">
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
              className="h-12 min-h-[48px] text-[16px] rounded-lg border-border focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Phone */}
          <div>
            <Label htmlFor="lead-phone" className="text-sm font-medium text-muted-foreground mb-1.5 block">
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
              className="h-12 min-h-[48px] text-[16px] rounded-lg border-border focus:ring-2 focus:ring-primary/20"
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

          {/* Submit Button - High contrast, prominent */}
          <Button
            type="submit"
            className="w-full h-14 min-h-[56px] text-base font-bold rounded-xl gap-2 shadow-lg hover:shadow-xl transition-all touch-active bg-primary hover:bg-primary/90"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Submitting...
              </span>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {content.buttonText}
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

          {/* Disclaimer */}
          <p className="text-[10px] leading-relaxed text-muted-foreground text-center">
            By submitting, you agree to receive communications from PresaleProperties. 
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
