import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Download, Calendar, CheckCircle, MessageCircle, Shield, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

const phoneRegex = /^[\+]?[1]?[-.\s]?[(]?[0-9]{3}[)]?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/;

const step1Schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Please enter a valid email").max(255),
});

const step2Schema = z.object({
  phone: z.string().trim().min(1, "Phone is required").regex(phoneRegex, "Enter a valid phone"),
  persona: z.enum(["first_time", "investor", "upgrader", "downsizer", "realtor"]),
  timeline: z.enum(["0_3", "3_6", "6_12", "12_plus"]),
  budget: z.enum(["under_600", "600_800", "800_1m", "over_1m"]),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

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
  { value: "realtor", label: "Realtor" },
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
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      setStep(1);
      setStep1Data(null);
    }
  }, [open]);

  const form1 = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: { name: "", email: "" },
  });

  const form2 = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      phone: "",
      persona: "first_time",
      timeline: "3_6",
      budget: "600_800",
    },
  });

  const onStep1Submit = (data: Step1Data) => {
    setStep1Data(data);
    setStep(2);
    // Track event
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "access_pack_step1", {
        page_path: window.location.pathname,
        project_name: projectName || "general",
      });
    }
  };

  const onStep2Submit = async (data: Step2Data) => {
    if (!step1Data) return;
    setIsSubmitting(true);

    try {
      const fullData = { ...step1Data, ...data };
      const utmParams = new URLSearchParams(window.location.search);
      
      const message = [
        `Persona: ${PERSONAS.find(p => p.value === data.persona)?.label}`,
        `Timeline: ${TIMELINES.find(t => t.value === data.timeline)?.label}`,
        `Budget: ${BUDGETS.find(b => b.value === data.budget)?.label}`,
        `Source: ${source}`,
        `UTM: ${utmParams.get("utm_source") || "direct"} / ${utmParams.get("utm_medium") || ""} / ${utmParams.get("utm_campaign") || ""}`,
      ].join(" | ");

      // Calculate next drip email time (instant for first email)
      const nextDripAt = new Date().toISOString();

      // Determine drip sequence based on persona
      const dripSequence = data.persona === "investor" ? "investor" : "buyer";

      // Save lead with qualifying data
      const { data: lead, error } = await supabase
        .from("project_leads")
        .insert({
          project_id: projectId || null,
          name: fullData.name,
          email: fullData.email,
          phone: fullData.phone,
          message,
          persona: data.persona,
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
        // Send to CRM
        supabase.functions
          .invoke("send-project-lead", { body: { leadId: lead.id } })
          .catch(console.error);

        // Trigger first drip email immediately
        supabase.functions
          .invoke("send-drip-email", {})
          .catch(console.error);
      }

      // Store persona in localStorage for personalization
      localStorage.setItem("presale_persona", data.persona);

      // Track conversion
      if (typeof window !== "undefined") {
        if ((window as any).gtag) {
          (window as any).gtag("event", "submit_access_pack", {
            page_path: window.location.pathname,
            project_name: projectName || "general",
            persona: data.persona,
            timeline: data.timeline,
            budget_range: data.budget,
          });
        }
        if ((window as any).fbq) {
          (window as any).fbq("track", "Lead", {
            content_name: projectName || "Access Pack",
            content_category: data.persona,
          });
        }
      }

      setStep(3);
      toast({
        title: "You're in!",
        description: "Check your email for floor plans and pricing.",
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
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-background">
        <VisuallyHidden>
          <DialogTitle>
            {variant === "floorplans" ? "Get Floorplans + Pricing" : "Book a Fit Call"}
          </DialogTitle>
        </VisuallyHidden>

        {/* Step 1 */}
        {step === 1 && (
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-3">
                <Download className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-bold">
                {variant === "floorplans" ? "Get Floorplans + Pricing" : "Book Your Fit Call"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {projectName ? `For ${projectName}` : "Instant access to all available projects"}
              </p>
            </div>

            <form onSubmit={form1.handleSubmit(onStep1Submit)} className="space-y-4">
              <div>
                <Label htmlFor="name">First Name</Label>
                <Input
                  id="name"
                  placeholder="John"
                  {...form1.register("name")}
                  className="h-12 mt-1"
                />
                {form1.formState.errors.name && (
                  <p className="text-xs text-destructive mt-1">{form1.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  {...form1.register("email")}
                  className="h-12 mt-1"
                />
                {form1.formState.errors.email && (
                  <p className="text-xs text-destructive mt-1">{form1.formState.errors.email.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full h-12 font-semibold">
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>

              <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                <Shield className="h-3 w-3" />
                No spam. Unsubscribe anytime.
              </p>
            </form>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="p-6">
            <div className="text-center mb-5">
              <h2 className="text-lg font-bold">Almost there!</h2>
              <p className="text-sm text-muted-foreground">Help us match you with the best options</p>
            </div>

            <form onSubmit={form2.handleSubmit(onStep2Submit)} className="space-y-4">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(604) 555-0123"
                  {...form2.register("phone")}
                  className="h-12 mt-1"
                />
                {form2.formState.errors.phone && (
                  <p className="text-xs text-destructive mt-1">{form2.formState.errors.phone.message}</p>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium">I am a...</Label>
                <RadioGroup
                  value={form2.watch("persona")}
                  onValueChange={(v) => form2.setValue("persona", v as any)}
                  className="grid grid-cols-2 gap-2 mt-2"
                >
                  {PERSONAS.map((p) => (
                    <Label
                      key={p.value}
                      className={`flex items-center justify-center h-10 rounded-lg border-2 cursor-pointer text-sm transition-all ${
                        form2.watch("persona") === p.value
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

              <div>
                <Label className="text-sm font-medium">Timeline to buy</Label>
                <RadioGroup
                  value={form2.watch("timeline")}
                  onValueChange={(v) => form2.setValue("timeline", v as any)}
                  className="grid grid-cols-2 gap-2 mt-2"
                >
                  {TIMELINES.map((t) => (
                    <Label
                      key={t.value}
                      className={`flex items-center justify-center h-10 rounded-lg border-2 cursor-pointer text-sm transition-all ${
                        form2.watch("timeline") === t.value
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
                <Label className="text-sm font-medium">Budget range</Label>
                <RadioGroup
                  value={form2.watch("budget")}
                  onValueChange={(v) => form2.setValue("budget", v as any)}
                  className="grid grid-cols-2 gap-2 mt-2"
                >
                  {BUDGETS.map((b) => (
                    <Label
                      key={b.value}
                      className={`flex items-center justify-center h-10 rounded-lg border-2 cursor-pointer text-sm transition-all ${
                        form2.watch("budget") === b.value
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

              <Button type="submit" className="w-full h-12 font-semibold" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Get Instant Access
                  </>
                )}
              </Button>
            </form>
          </div>
        )}

        {/* Step 3 - Success */}
        {step === 3 && (
          <div className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 rounded-full mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-xl font-bold mb-2">You're All Set!</h2>
            <p className="text-muted-foreground mb-6">
              Check your email for floor plans, pricing, and current incentives.
            </p>

            <div className="space-y-3">
              <Button asChild className="w-full h-12 bg-green-600 hover:bg-green-700">
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Chat with an Agent Now
                </a>
              </Button>
              
              <Button variant="outline" className="w-full h-12" onClick={() => onOpenChange(false)}>
                <Calendar className="h-4 w-4 mr-2" />
                Book a 10-min Fit Call
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
