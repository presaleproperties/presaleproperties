import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Download, CheckCircle, Sparkles } from "lucide-react";
import { formatPhoneNumber } from "@/lib/formatPhone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { upsertProjectLead } from "@/lib/upsertProjectLead";
import { useLeadSubmission } from "@/hooks/useLeadSubmission";
import { getVisitorId } from "@/lib/tracking";

const phoneRegex = /^[\+]?[1]?[-.\s]?[(]?[0-9]{3}[)]?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/;

const leadSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Please enter a valid email").max(255),
  phone: z.string().trim().min(1, "Phone number is required").regex(phoneRegex, "Please enter a valid phone number"),
  isRealtor: z.boolean().default(false),
});

type LeadFormData = z.infer<typeof leadSchema>;

interface LeadCaptureFormProps {
  listingId: string;
  agentId: string;
  listingTitle: string;
  isRestricted?: boolean;
}

export function LeadCaptureForm({ listingId, agentId, listingTitle, isRestricted = false }: LeadCaptureFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitted: formIsSubmitted },
    reset,
    watch,
    setValue,
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      isRealtor: false,
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
      const message = data.isRealtor ? "I'm a Realtor" : null;

      const { data: leadData, error } = await (supabase as any)
        .from("leads")
        .insert({
          listing_id: listingId,
          agent_id: agentId,
          name: data.name,
          email: data.email,
          phone: data.phone,
          message: message,
        })
        .select("id")
        .maybeSingle();

      if (error) throw error;

      if (leadData?.id) {
        supabase.functions
          .invoke("send-lead-notification", { body: { leadId: leadData.id } })
          .catch((err) => console.log("Email notification skipped:", err));
      }

      setIsSubmitted(true);
      reset();
      toast({
        title: "Request Sent!",
        description: "The agent will be in touch with you shortly.",
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

  if (isSubmitted) {
    return (
      <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-premium">
        <div className="h-0.5 bg-gradient-to-r from-primary via-primary/70 to-transparent" />
        <div className="bg-foreground px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-11 h-11 bg-primary/15 rounded-xl">
              <CheckCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-background">Request Sent!</h3>
              <p className="text-xs text-background/45 font-medium">The agent will contact you shortly.</p>
            </div>
          </div>
        </div>
        <div className="p-5">
          <Button variant="outline" onClick={() => setIsSubmitted(false)} className="w-full rounded-lg">
            Send Another Request
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-premium">
      <div className="h-0.5 bg-gradient-to-r from-primary via-primary/70 to-transparent" />

      {/* Header */}
      <div className="bg-foreground px-5 py-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(var(--primary)/0.06),_transparent_60%)]" />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-medium tracking-wide text-primary bg-primary/15 px-2.5 py-1 rounded-md mb-2.5">
            <Sparkles className="h-3 w-3" />
            {isRestricted ? "Exclusive Assignment" : "High Interest"}
          </span>
          <h3 className="text-xl font-bold text-background leading-snug">
            {isRestricted ? "Get Full Details" : "Interested in this assignment?"}
          </h3>
          <p className="text-xs text-background/45 mt-1.5 font-medium">
            {isRestricted
              ? "Submit your info to receive full assignment details."
              : "Submit your info and the agent will reach out shortly."}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="p-5">
        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold text-foreground/80">Full Name</Label>
            <Input
              id="name"
              placeholder="John Smith"
              autoComplete="name"
              {...register("name")}
              className={`h-12 sm:h-11 rounded-lg border border-border bg-background shadow-[inset_0_1px_2px_hsl(var(--foreground)/0.04)] placeholder:text-muted-foreground/40 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all ${errors.name ? "border-destructive" : ""}`}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold text-foreground/80">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              autoComplete="email"
              {...register("email")}
              className={`h-12 sm:h-11 rounded-lg border border-border bg-background shadow-[inset_0_1px_2px_hsl(var(--foreground)/0.04)] placeholder:text-muted-foreground/40 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all ${errors.email ? "border-destructive" : ""}`}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-xs font-semibold text-foreground/80">Phone</Label>
            <Input
              id="phone"
              type="tel"
              inputMode="numeric"
              placeholder="(604) 555-0123"
              autoComplete="tel"
              value={watch("phone")}
              onChange={(e) => setValue("phone", formatPhoneNumber(e.target.value), { shouldValidate: formIsSubmitted })}
              className={`h-12 sm:h-11 rounded-lg border border-border bg-background shadow-[inset_0_1px_2px_hsl(var(--foreground)/0.04)] placeholder:text-muted-foreground/40 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all ${errors.phone ? "border-destructive" : ""}`}
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>

          {/* I'm a Realtor checkbox */}
          <div className="flex items-center gap-3 pt-0.5">
            <Checkbox
              id="listing-isRealtor"
              checked={watch("isRealtor")}
              onCheckedChange={(checked) => setValue("isRealtor", checked === true)}
              className="h-[18px] w-[18px] rounded border-border/80 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-colors"
            />
            <Label htmlFor="listing-isRealtor" className="text-sm text-foreground/70 cursor-pointer select-none">
              I'm a Realtor
            </Label>
          </div>

          <Button
            type="submit"
            className="w-full h-12 sm:h-11 text-sm font-semibold rounded-lg shadow-gold hover:shadow-gold-glow transition-all"
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
                <Download className="h-4 w-4 mr-2" />
                Download Info
              </>
            )}
          </Button>

          <p className="text-center text-[10px] text-muted-foreground/60">
            <span className="text-primary/70">✓</span> Instant access · No spam
          </p>
        </form>
      </div>
    </div>
  );
}