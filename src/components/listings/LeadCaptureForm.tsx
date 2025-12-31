import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send, CheckCircle, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Accepts: (604) 555-0123, 604-555-0123, 6045550123, +1 604 555 0123, etc.
const phoneRegex = /^[\+]?[1]?[-.\s]?[(]?[0-9]{3}[)]?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/;

const leadSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Please enter a valid email").max(255, "Email must be less than 255 characters"),
  phone: z.string().trim().min(1, "Phone number is required").regex(phoneRegex, "Please enter a valid phone number"),
  message: z.string().trim().max(1000, "Message must be less than 1000 characters").optional().or(z.literal("")),
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
    formState: { errors },
    reset,
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
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
      const { data: leadData, error } = await supabase
        .from("leads")
        .insert({
          listing_id: listingId,
          agent_id: agentId,
          name: data.name,
          email: data.email,
          phone: data.phone,
          message: data.message || null,
        })
        .select("id")
        .maybeSingle();

      if (error) throw error;

      // Try to send email notification (non-blocking)
      if (leadData?.id) {
        supabase.functions
          .invoke("send-lead-notification", {
            body: { leadId: leadData.id },
          })
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
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-lg">
        {/* Header - Neutral dark gradient */}
        <div className="bg-gradient-to-br from-foreground via-foreground to-foreground/85 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-green-500/20 rounded-full">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-background">Request Sent!</h3>
              <p className="text-sm text-background/70">The agent will contact you shortly.</p>
            </div>
          </div>
        </div>
        <div className="p-5">
          <Button
            variant="outline"
            onClick={() => setIsSubmitted(false)}
            className="w-full"
          >
            Send Another Request
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-lg">
      {/* Header - Neutral dark gradient for welcoming feel */}
      <div className="bg-gradient-to-br from-foreground via-foreground to-foreground/85 px-5 py-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/20 px-2 py-0.5 rounded-full">
            <Sparkles className="h-3 w-3" />
            {isRestricted ? "Exclusive Assignment" : "High Interest"}
          </span>
        </div>
        <h3 className="text-xl font-bold text-background">
          {isRestricted ? "Get Full Details" : "Interested in this assignment?"}
        </h3>
        <p className="text-sm text-background/70 mt-1">
          {isRestricted 
            ? "Some details are restricted. Submit your info to receive full assignment details."
            : "Submit your info and the agent will reach out within 24 hours."
          }
        </p>
      </div>

      {/* Form */}
      <div className="p-5">
        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">Full Name *</Label>
            <Input
              id="name"
              placeholder="Your full name"
              {...register("name")}
              className={`h-11 ${errors.name ? "border-destructive" : ""}`}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              {...register("email")}
              className={`h-11 ${errors.email ? "border-destructive" : ""}`}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium">Phone *</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="(604) 555-0123"
              {...register("phone")}
              className={`h-11 ${errors.phone ? "border-destructive" : ""}`}
            />
            {errors.phone && (
              <p className="text-xs text-destructive">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-medium">Message (optional)</Label>
            <Textarea
              id="message"
              placeholder={isRestricted 
                ? "I'm interested in learning more about this restricted assignment..."
                : "I'm interested in learning more about this assignment..."
              }
              rows={3}
              {...register("message")}
              className={errors.message ? "border-destructive" : ""}
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              "Sending..."
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {isRestricted ? "Request Full Details" : "Send Request"}
              </>
            )}
          </Button>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Typical response time: under 24 hours</span>
          </div>
        </form>
      </div>
    </div>
  );
}
