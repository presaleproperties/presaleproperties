import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, CheckCircle, MessageCircle, Shield, Send } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

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
  variant?: "floorplans" | "fit_call";
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
  const [whatsappNumber, setWhatsappNumber] = useState<string>("16722581100");
  const { toast } = useToast();

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
    if (!open) {
      setIsSuccess(false);
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

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      // Get UTM from sessionStorage (populated by UtmTracker)
      const utmSource = sessionStorage.getItem("utm_source") || null;
      const utmMedium = sessionStorage.getItem("utm_medium") || null;
      const utmCampaign = sessionStorage.getItem("utm_campaign") || null;
      const utmContent = sessionStorage.getItem("utm_content") || null;
      const utmTerm = sessionStorage.getItem("utm_term") || null;
      const referrer = sessionStorage.getItem("referrer") || document.referrer || null;
      const landingPage = sessionStorage.getItem("landing_page") || window.location.href;
      
      const messageData = [
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
      
      // Use client-side generated ID to avoid RLS read issues
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
          timeline: data.timeline,
          drip_sequence: dripSequence,
          last_drip_sent: 0,
          next_drip_at: nextDripAt,
          lead_source: source === "fit_call" ? "callback_request" : "general_inquiry",
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
          utm_content: utmContent,
          utm_term: utmTerm,
          referrer: referrer,
          landing_page: landingPage,
        });

      if (error) throw error;

      // Trigger edge function for Zapier webhook
      supabase.functions
        .invoke("send-project-lead", { body: { leadId } })
        .catch(console.error);

      supabase.functions
        .invoke("send-drip-email", {})
        .catch(console.error);

      localStorage.setItem("presale_persona", actualPersona);

      if (typeof window !== "undefined") {
        if ((window as any).gtag) {
          (window as any).gtag("event", "submit_access_pack", {
            page_path: window.location.pathname,
            project_name: projectName || "general",
            persona: actualPersona,
            timeline: data.timeline,
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

  const whatsappMessage = encodeURIComponent(
    `Hi! I just requested the ${projectName || "presale"} package. Can you help me shortlist the best options in my budget?`
  );
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-lg p-0 overflow-hidden bg-background max-h-[95vh] overflow-y-auto"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <VisuallyHidden>
          <DialogTitle>
            {variant === "floorplans" ? "Chat with us" : "Request a Call Back"}
          </DialogTitle>
        </VisuallyHidden>

        {!isSuccess ? (
          <div className="p-4 sm:p-6">
            <div className="text-center mb-3 sm:mb-6">
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full mb-2">
                {variant === "floorplans" ? (
                  <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                ) : (
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-bold">
                {variant === "floorplans" ? "Chat With Us" : "Request a Call Back"}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {projectName 
                  ? `Get expert guidance on ${projectName}` 
                  : "Connect with our presale experts"}
              </p>
              <p className="text-xs text-green-600 font-medium mt-1">
                ✓ Same-day callback available
              </p>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2.5 sm:space-y-4">
              {/* Contact Info - First/Last Name side by side */}
              <div className="space-y-2 sm:space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="firstName" className="text-xs sm:text-sm">
                      First Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      autoComplete="given-name"
                      {...form.register("firstName")}
                      className="h-9 sm:h-11 mt-0.5 text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-xs sm:text-sm">
                      Last Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      placeholder="Smith"
                      autoComplete="family-name"
                      {...form.register("lastName")}
                      className="h-9 sm:h-11 mt-0.5 text-base"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email" className="text-xs sm:text-sm">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@email.com"
                    autoComplete="email"
                    {...form.register("email")}
                    className="h-9 sm:h-11 mt-0.5 text-base"
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-xs sm:text-sm">
                    Phone <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="604-555-0123"
                    autoComplete="tel"
                    {...form.register("phone")}
                    className="h-9 sm:h-11 mt-0.5 text-base"
                  />
                </div>
              </div>

              {/* I am a... */}
              <div>
                <Label className="text-xs sm:text-sm font-medium">
                  I am a... <span className="text-destructive">*</span>
                </Label>
                <RadioGroup
                  value={form.watch("persona")}
                  onValueChange={(v) => form.setValue("persona", v as any)}
                  className="grid grid-cols-2 gap-1.5 sm:gap-2 mt-1"
                >
                  {PERSONAS.map((p) => (
                    <Label
                      key={p.value}
                      className={`flex items-center justify-center h-8 sm:h-10 rounded-lg border-2 cursor-pointer text-xs sm:text-sm transition-all ${
                        form.watch("persona") === p.value
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border hover:border-muted-foreground/50"
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
                <Label className="text-xs sm:text-sm font-medium">
                  Working with a Realtor? <span className="text-destructive">*</span>
                </Label>
                <RadioGroup
                  value={form.watch("workingWithAgent")}
                  onValueChange={(v) => form.setValue("workingWithAgent", v as any)}
                  className="grid grid-cols-3 gap-1.5 sm:gap-2 mt-1"
                >
                  {AGENT_OPTIONS.map((a) => (
                    <Label
                      key={a.value}
                      className={`flex items-center justify-center h-8 sm:h-10 rounded-lg border-2 cursor-pointer text-xs sm:text-sm transition-all ${
                        form.watch("workingWithAgent") === a.value
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border hover:border-muted-foreground/50"
                      }`}
                    >
                      <RadioGroupItem value={a.value} className="sr-only" />
                      {a.label}
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              {/* Timeline & Property Type - side by side on mobile */}
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div>
                  <Label className="text-xs sm:text-sm font-medium">
                    Timeline <span className="text-destructive">*</span>
                  </Label>
                  <RadioGroup
                    value={form.watch("timeline")}
                    onValueChange={(v) => form.setValue("timeline", v as any)}
                    className="grid grid-cols-1 gap-1.5 sm:gap-2 mt-1"
                  >
                    {TIMELINES.map((t) => (
                      <Label
                        key={t.value}
                        className={`flex items-center justify-center h-8 sm:h-10 rounded-lg border-2 cursor-pointer text-xs sm:text-sm transition-all ${
                          form.watch("timeline") === t.value
                            ? "border-primary bg-primary/10 text-primary font-medium"
                            : "border-border hover:border-muted-foreground/50"
                        }`}
                      >
                        <RadioGroupItem value={t.value} className="sr-only" />
                        {t.label}
                      </Label>
                    ))}
                  </RadioGroup>
                </div>

                <div>
                  <Label className="text-xs sm:text-sm font-medium">
                    Looking for <span className="text-destructive">*</span>
                  </Label>
                  <RadioGroup
                    value={form.watch("propertyType")}
                    onValueChange={(v) => form.setValue("propertyType", v as any)}
                    className="grid grid-cols-1 gap-1.5 sm:gap-2 mt-1"
                  >
                    {PROPERTY_TYPES.map((pt) => (
                      <Label
                        key={pt.value}
                        className={`flex items-center justify-center h-8 sm:h-10 rounded-lg border-2 cursor-pointer text-xs sm:text-sm transition-all ${
                          form.watch("propertyType") === pt.value
                            ? "border-primary bg-primary/10 text-primary font-medium"
                            : "border-border hover:border-muted-foreground/50"
                        }`}
                      >
                        <RadioGroupItem value={pt.value} className="sr-only" />
                        {pt.label}
                      </Label>
                    ))}
                  </RadioGroup>
                </div>
              </div>

              <Button type="submit" className="w-full h-10 sm:h-12 font-semibold text-sm sm:text-base" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Request
                  </>
                )}
              </Button>

              <p className="text-[9px] sm:text-[10px] text-center text-muted-foreground leading-relaxed">
                By submitting, you agree to receive communications from PresaleProperties. 
                This is not a condition of purchase. View our{" "}
                <a href="/privacy" className="underline hover:text-foreground">Privacy Policy</a>.
              </p>
            </form>
          </div>
        ) : (
          <div className="p-4 sm:p-6 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-green-500/10 rounded-full mb-3">
              <CheckCircle className="h-7 w-7 sm:h-8 sm:w-8 text-green-500" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold mb-2">Thank You!</h2>
            <p className="text-sm text-muted-foreground mb-4">
              We've received your request and will be in touch shortly.
            </p>

            <div className="space-y-2">
              <Button asChild className="w-full h-10 sm:h-12 bg-green-600 hover:bg-green-700">
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Chat with Us on WhatsApp
                </a>
              </Button>
              
              <Button variant="outline" className="w-full h-10 sm:h-12" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}