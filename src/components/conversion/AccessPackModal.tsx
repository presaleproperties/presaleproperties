import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Download, Calendar, CheckCircle, MessageCircle, Shield, Send } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

const phoneRegex = /^[\+]?[1]?[-.\s]?[(]?[0-9]{3}[)]?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/;

const formSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Please enter a valid email").max(255),
  phone: z.string().trim().min(1, "Phone is required").regex(phoneRegex, "Enter a valid phone number"),
  persona: z.enum(["first_time", "investor", "upgrader", "downsizer"]),
  workingWithAgent: z.enum(["yes", "no", "i_am_realtor"]),
  timeline: z.enum(["0_3", "3_6", "6_12", "12_plus"]),
  budget: z.enum(["under_600", "600_800", "800_1m", "over_1m"]),
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
  { value: "upgrader", label: "Upgrading" },
  { value: "downsizer", label: "Downsizing" },
];

const AGENT_OPTIONS = [
  { value: "no", label: "No" },
  { value: "yes", label: "Yes" },
  { value: "i_am_realtor", label: "I am a Realtor" },
];

const TIMELINES = [
  { value: "0_3", label: "0–3 months" },
  { value: "3_6", label: "3–6 months" },
  { value: "6_12", label: "6–12 months" },
  { value: "12_plus", label: "12+ months" },
];

const BUDGETS = [
  { value: "under_600", label: "Under $600K" },
  { value: "600_800", label: "$600K – $800K" },
  { value: "800_1m", label: "$800K – $1M" },
  { value: "over_1m", label: "$1M+" },
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
      name: "",
      email: "",
      phone: "",
      persona: "first_time",
      workingWithAgent: "no",
      timeline: "3_6",
      budget: "600_800",
      message: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      const utmParams = new URLSearchParams(window.location.search);
      
      // Build message with all qualifying data
      const messageData = [
        `Persona: ${PERSONAS.find(p => p.value === data.persona)?.label}`,
        `Working with Agent: ${AGENT_OPTIONS.find(a => a.value === data.workingWithAgent)?.label}`,
        `Timeline: ${TIMELINES.find(t => t.value === data.timeline)?.label}`,
        `Budget: ${BUDGETS.find(b => b.value === data.budget)?.label}`,
        `Source: ${source}`,
        `UTM: ${utmParams.get("utm_source") || "direct"} / ${utmParams.get("utm_medium") || ""} / ${utmParams.get("utm_campaign") || ""}`,
        data.message ? `\n\nMessage: ${data.message}` : "",
      ].filter(Boolean).join(" | ");

      // Calculate next drip email time (instant for first email)
      const nextDripAt = new Date().toISOString();

      // Determine drip sequence based on persona
      const dripSequence = data.persona === "investor" ? "investor" : "buyer";
      
      // Determine actual persona (realtor overrides)
      const actualPersona = data.workingWithAgent === "i_am_realtor" ? "realtor" : data.persona;

      // Save lead with qualifying data
      const { data: lead, error } = await supabase
        .from("project_leads")
        .insert({
          project_id: projectId || null,
          name: data.name,
          email: data.email,
          phone: data.phone,
          message: messageData,
          persona: actualPersona,
          timeline: data.timeline,
          budget: data.budget,
          drip_sequence: dripSequence,
          last_drip_sent: 0,
          next_drip_at: nextDripAt,
        })
        .select("id")
        .maybeSingle();

      if (error) throw error;

      // Trigger CRM webhook and start drip sequence
      if (lead?.id) {
        supabase.functions
          .invoke("send-project-lead", { body: { leadId: lead.id } })
          .catch(console.error);

        supabase.functions
          .invoke("send-drip-email", {})
          .catch(console.error);
      }

      // Store persona in localStorage for personalization
      localStorage.setItem("presale_persona", actualPersona);

      // Track conversion
      if (typeof window !== "undefined") {
        if ((window as any).gtag) {
          (window as any).gtag("event", "submit_access_pack", {
            page_path: window.location.pathname,
            project_name: projectName || "general",
            persona: actualPersona,
            timeline: data.timeline,
            budget_range: data.budget,
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
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-background max-h-[90vh] overflow-y-auto">
        <VisuallyHidden>
          <DialogTitle>
            {variant === "floorplans" ? "Chat with us" : "Request a Call Back"}
          </DialogTitle>
        </VisuallyHidden>

        {!isSuccess ? (
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-3">
                {variant === "floorplans" ? (
                  <MessageCircle className="h-6 w-6 text-primary" />
                ) : (
                  <Calendar className="h-6 w-6 text-primary" />
                )}
              </div>
              <h2 className="text-xl font-bold">
                {variant === "floorplans" ? "Chat With Us" : "Request a Call Back"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {projectName 
                  ? `Get expert guidance on ${projectName}` 
                  : "Connect with our presale experts for personalized advice"}
              </p>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="name">
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="John"
                    {...form.register("name")}
                    className="h-11 mt-1"
                  />
                  {form.formState.errors.name && (
                    <p className="text-xs text-destructive mt-1">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone">
                    Phone <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(604) 555-0123"
                    {...form.register("phone")}
                    className="h-11 mt-1"
                  />
                  {form.formState.errors.phone && (
                    <p className="text-xs text-destructive mt-1">{form.formState.errors.phone.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  {...form.register("email")}
                  className="h-11 mt-1"
                />
                {form.formState.errors.email && (
                  <p className="text-xs text-destructive mt-1">{form.formState.errors.email.message}</p>
                )}
              </div>

              {/* I am a... */}
              <div>
                <Label className="text-sm font-medium">
                  I am a... <span className="text-destructive">*</span>
                </Label>
                <RadioGroup
                  value={form.watch("persona")}
                  onValueChange={(v) => form.setValue("persona", v as any)}
                  className="grid grid-cols-2 gap-2 mt-2"
                >
                  {PERSONAS.map((p) => (
                    <Label
                      key={p.value}
                      className={`flex items-center justify-center h-10 rounded-lg border-2 cursor-pointer text-sm transition-all ${
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
                <Label className="text-sm font-medium">
                  Are you working with a Realtor? <span className="text-destructive">*</span>
                </Label>
                <RadioGroup
                  value={form.watch("workingWithAgent")}
                  onValueChange={(v) => form.setValue("workingWithAgent", v as any)}
                  className="grid grid-cols-3 gap-2 mt-2"
                >
                  {AGENT_OPTIONS.map((a) => (
                    <Label
                      key={a.value}
                      className={`flex items-center justify-center h-10 rounded-lg border-2 cursor-pointer text-sm transition-all ${
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

              {/* Timeline */}
              <div>
                <Label className="text-sm font-medium">
                  Timeline to buy <span className="text-destructive">*</span>
                </Label>
                <RadioGroup
                  value={form.watch("timeline")}
                  onValueChange={(v) => form.setValue("timeline", v as any)}
                  className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2"
                >
                  {TIMELINES.map((t) => (
                    <Label
                      key={t.value}
                      className={`flex items-center justify-center h-10 rounded-lg border-2 cursor-pointer text-sm transition-all ${
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

              {/* Budget */}
              <div>
                <Label className="text-sm font-medium">
                  Budget range <span className="text-destructive">*</span>
                </Label>
                <RadioGroup
                  value={form.watch("budget")}
                  onValueChange={(v) => form.setValue("budget", v as any)}
                  className="grid grid-cols-2 gap-2 mt-2"
                >
                  {BUDGETS.map((b) => (
                    <Label
                      key={b.value}
                      className={`flex items-center justify-center h-10 rounded-lg border-2 cursor-pointer text-sm transition-all ${
                        form.watch("budget") === b.value
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border hover:border-muted-foreground/50"
                      }`}
                    >
                      <RadioGroupItem value={b.value} className="sr-only" />
                      {b.label}
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              {/* Message */}
              <div>
                <Label htmlFor="message">Message (optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Tell us what you're looking for..."
                  {...form.register("message")}
                  className="mt-1 min-h-[80px] resize-none"
                />
              </div>

              <Button type="submit" className="w-full h-12 font-semibold" disabled={isSubmitting}>
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

              <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                <Shield className="h-3 w-3" />
                No spam. Unsubscribe anytime.
              </p>
            </form>
          </div>
        ) : (
          <div className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 rounded-full mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-xl font-bold mb-2">Thank You!</h2>
            <p className="text-muted-foreground mb-6">
              We've received your request and will be in touch shortly.
            </p>

            <div className="space-y-3">
              <Button asChild className="w-full h-12 bg-green-600 hover:bg-green-700">
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Chat with Us on WhatsApp
                </a>
              </Button>
              
              <Button variant="outline" className="w-full h-12" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
