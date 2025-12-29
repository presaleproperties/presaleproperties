import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send, CheckCircle, Sparkles, Download, MessageCircle, Shield, Clock, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const phoneRegex = /^[\+]?[1]?[-.\s]?[(]?[0-9]{3}[)]?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/;

const leadSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Please enter a valid email").max(255),
  phone: z.string().trim().min(1, "Phone is required").regex(phoneRegex, "Enter a valid phone number"),
  persona: z.enum(["first_time", "investor"]),
  workingWithAgent: z.enum(["yes", "no", "i_am_realtor"]),
  timeline: z.enum(["0_3", "3_plus"]),
  propertyType: z.enum(["condo", "townhome"]),
});

type LeadFormData = z.infer<typeof leadSchema>;

interface ProjectLeadFormProps {
  projectId: string;
  projectName: string;
  status: "coming_soon" | "active" | "sold_out";
  brochureUrl?: string | null;
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

export function ProjectLeadForm({ projectId, projectName, status, brochureUrl }: ProjectLeadFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState<string>("16722581100");
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

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      persona: "first_time",
      workingWithAgent: "no",
      timeline: "0_3",
      propertyType: "condo",
    },
  });

  const onInvalid = () => {
    toast({
      title: "Please check the form",
      description: "Name, email, and phone number are required.",
      variant: "destructive",
    });
  };

  const onSubmit = async (data: LeadFormData) => {
    setIsSubmitting(true);

    try {
      const messageData = [
        `Persona: ${PERSONAS.find(p => p.value === data.persona)?.label}`,
        `Working with Agent: ${AGENT_OPTIONS.find(a => a.value === data.workingWithAgent)?.label}`,
        `Timeline: ${TIMELINES.find(t => t.value === data.timeline)?.label}`,
        `Property Type: ${PROPERTY_TYPES.find(pt => pt.value === data.propertyType)?.label}`,
      ].join(" | ");

      const nextDripAt = new Date().toISOString();
      const dripSequence = data.persona === "investor" ? "investor" : "buyer";
      const actualPersona = data.workingWithAgent === "i_am_realtor" ? "realtor" : data.persona;

      const { data: insertedLead, error } = await supabase
        .from("project_leads")
        .insert({
          project_id: projectId,
          name: data.name,
          email: data.email,
          phone: data.phone,
          message: messageData,
          persona: actualPersona,
          timeline: data.timeline,
          drip_sequence: dripSequence,
          last_drip_sent: 0,
          next_drip_at: nextDripAt,
        })
        .select("id")
        .maybeSingle();

      if (error) throw error;

      if (insertedLead?.id) {
        supabase.functions
          .invoke("send-project-lead", { body: { leadId: insertedLead.id } })
          .catch(console.error);

        supabase.functions
          .invoke("send-drip-email", {})
          .catch(console.error);
      }

      localStorage.setItem("presale_persona", actualPersona);

      // Analytics tracking
      if (typeof window !== "undefined") {
        if ((window as any).gtag) {
          (window as any).gtag("event", "submit_access_pack", {
            page_path: window.location.pathname,
            project_name: projectName,
            persona: actualPersona,
            timeline: data.timeline,
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
      <div className="bg-card border-2 border-green-500/30 rounded-2xl p-6 text-center shadow-lg">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/15 rounded-full mb-4">
          <CheckCircle className="h-8 w-8 text-green-500" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">You're All Set!</h3>
        <p className="text-muted-foreground mb-4">
          Check your email for the latest pricing & floor plans.
        </p>
        
        {brochureUrl && (
          <Button
            asChild
            size="lg"
            className="w-full h-14 text-base font-semibold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground mb-3"
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
    );
  }

  const getFormContent = () => {
    switch (status) {
      case "coming_soon":
        return {
          badge: "Coming Soon",
          badgeIcon: <Sparkles className="h-3 w-3" />,
          title: "Get Early Access",
          subtitle: "Floor Plans & Pricing",
          description: "Be the first to receive exclusive pricing and floor plans.",
          buttonText: "Get Early Access",
          buttonIcon: <ArrowRight className="h-5 w-5" />,
        };
      case "active":
        return {
          badge: "Instant Access",
          badgeIcon: <Download className="h-3 w-3" />,
          title: "Get Floor Plans",
          subtitle: "& Pricing Instantly",
          description: "Access all floor plans, pricing, and current incentives.",
          buttonText: "Get Instant Access",
          buttonIcon: <ArrowRight className="h-5 w-5" />,
        };
      default:
        return {
          badge: "Sold Out",
          badgeIcon: null,
          title: "Get Notified",
          subtitle: "of Similar Projects",
          description: "Be first to know about similar upcoming projects.",
          buttonText: "Notify Me",
          buttonIcon: <Send className="h-5 w-5" />,
        };
    }
  };

  const content = getFormContent();

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="bg-primary px-5 py-4">
        {content.badgeIcon && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-foreground/90 bg-primary-foreground/15 px-2.5 py-1 rounded-full mb-2">
            {content.badgeIcon}
            {content.badge}
          </span>
        )}
        <h3 className="text-xl font-bold text-primary-foreground leading-tight">
          {content.title}
          <span className="block text-primary-foreground/90 text-lg">{content.subtitle}</span>
        </h3>
        <p className="text-xs text-primary-foreground/75 mt-1">{content.description}</p>
      </div>

      {/* Form */}
      <div className="p-4 bg-card">
        <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-3">
          {/* Contact Fields */}
          <div className="space-y-2">
            <div>
              <Label htmlFor="lead-name" className="text-xs font-semibold">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lead-name"
                placeholder="John Smith"
                autoComplete="off"
                {...form.register("name")}
                className="h-10 text-sm rounded-lg"
              />
            </div>

            <div>
              <Label htmlFor="lead-phone" className="text-xs font-semibold">
                Phone <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lead-phone"
                type="tel"
                placeholder="604-555-0123"
                autoComplete="off"
                {...form.register("phone")}
                className="h-10 text-sm rounded-lg"
              />
            </div>

            <div>
              <Label htmlFor="lead-email" className="text-xs font-semibold">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lead-email"
                type="email"
                placeholder="john@email.com"
                autoComplete="off"
                {...form.register("email")}
                className="h-10 text-sm rounded-lg"
              />
            </div>
          </div>

          {/* I am a... */}
          <div>
            <Label className="text-xs font-semibold">
              I am a... <span className="text-destructive">*</span>
            </Label>
            <RadioGroup
              value={form.watch("persona")}
              onValueChange={(v) => form.setValue("persona", v as any)}
              className="grid grid-cols-2 gap-1.5 mt-1"
            >
              {PERSONAS.map((p) => (
                <Label
                  key={p.value}
                  className={`flex items-center justify-center h-9 rounded-lg border-2 cursor-pointer text-xs transition-all ${
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
            <Label className="text-xs font-semibold">
              Working with a Realtor? <span className="text-destructive">*</span>
            </Label>
            <RadioGroup
              value={form.watch("workingWithAgent")}
              onValueChange={(v) => form.setValue("workingWithAgent", v as any)}
              className="grid grid-cols-3 gap-1.5 mt-1"
            >
              {AGENT_OPTIONS.map((a) => (
                <Label
                  key={a.value}
                  className={`flex items-center justify-center h-9 rounded-lg border-2 cursor-pointer text-xs transition-all ${
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

          {/* Timeline & Property Type side by side */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs font-semibold">
                Timeline <span className="text-destructive">*</span>
              </Label>
              <RadioGroup
                value={form.watch("timeline")}
                onValueChange={(v) => form.setValue("timeline", v as any)}
                className="grid grid-cols-1 gap-1.5 mt-1"
              >
                {TIMELINES.map((t) => (
                  <Label
                    key={t.value}
                    className={`flex items-center justify-center h-9 rounded-lg border-2 cursor-pointer text-xs transition-all ${
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
              <Label className="text-xs font-semibold">
                Looking for <span className="text-destructive">*</span>
              </Label>
              <RadioGroup
                value={form.watch("propertyType")}
                onValueChange={(v) => form.setValue("propertyType", v as any)}
                className="grid grid-cols-1 gap-1.5 mt-1"
              >
                {PROPERTY_TYPES.map((pt) => (
                  <Label
                    key={pt.value}
                    className={`flex items-center justify-center h-9 rounded-lg border-2 cursor-pointer text-xs transition-all ${
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

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-12 text-sm font-bold rounded-xl gap-2 shadow-lg"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Sending...
              </span>
            ) : (
              <>
                {content.buttonText}
                {content.buttonIcon}
              </>
            )}
          </Button>

          {/* Trust indicators */}
          <div className="flex items-center justify-center gap-4 pt-1 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Shield className="h-3 w-3 text-green-500" />
              Secure
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-blue-500" />
              Instant
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3 text-purple-500" />
              Free
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}