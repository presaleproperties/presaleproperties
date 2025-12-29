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

// Accepts: (604) 555-0123, 604-555-0123, 6045550123, +1 604 555 0123, etc.
const phoneRegex = /^[\+]?[1]?[-.\s]?[(]?[0-9]{3}[)]?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/;

const leadSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Please enter a valid email").max(255, "Email must be less than 255 characters"),
  phone: z.string().trim().min(1, "Phone number is required").regex(phoneRegex, "Please enter a valid phone number"),
  is_realtor: z.enum(["yes", "no"]),
  has_realtor: z.enum(["yes", "no"]),
});

type LeadFormData = z.infer<typeof leadSchema>;

interface ProjectLeadFormProps {
  projectId: string;
  projectName: string;
  status: "coming_soon" | "active" | "sold_out";
}

export function ProjectLeadForm({ projectId, projectName, status }: ProjectLeadFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState<string>("");
  const { toast } = useToast();

  // Fetch WhatsApp number from settings
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

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      is_realtor: "no",
      has_realtor: "no",
    },
  });

  const isRealtor = watch("is_realtor");
  const hasRealtor = watch("has_realtor");

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
      const isRealtorNote = data.is_realtor === "yes" ? "Is a realtor" : "Not a realtor";
      const hasRealtorNote = data.has_realtor === "yes" ? "Has a realtor" : "No realtor";
      const notes = `${isRealtorNote} | ${hasRealtorNote}`;

      // Insert lead into database
      const { data: insertedLead, error } = await supabase
        .from("project_leads")
        .insert({
          project_id: projectId,
          name: data.name,
          email: data.email,
          phone: data.phone,
          message: notes,
        })
        .select("id")
        .maybeSingle();

      if (error) throw error;

      // Send to CRM via edge function (fire and forget)
      if (insertedLead?.id) {
        supabase.functions
          .invoke("send-project-lead", {
            body: { leadId: insertedLead.id },
          })
          .catch((err) => {
            console.error("Error sending to CRM:", err);
            // Don't show error to user - lead was still saved
          });
      }

      setIsSubmitted(true);
      reset();
      toast({
        title: status === "coming_soon" ? "You're on the list!" : "Plans sent!",
        description:
          status === "coming_soon"
            ? "We'll send you exclusive updates and early access."
            : "Check your email for floor plans and pricing.",
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

  const defaultWhatsappNumber = "16722581100";
  const whatsappMessage = encodeURIComponent(`Hi! I just submitted my info for ${projectName} and would love to learn more.`);
  const whatsappLink = `https://wa.me/${whatsappNumber || defaultWhatsappNumber}?text=${whatsappMessage}`;

  if (isSubmitted) {
    return (
      <div className="bg-card border-2 border-green-500/30 rounded-2xl p-6 text-center shadow-lg">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/15 rounded-full mb-4">
          <CheckCircle className="h-8 w-8 text-green-500" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">
          You're All Set!
        </h3>
        <p className="text-muted-foreground mb-5">
          Check your email for floor plans, pricing, and project details.
        </p>
        <Button
          asChild
          size="lg"
          className="w-full h-14 text-base font-semibold rounded-xl bg-green-600 hover:bg-green-700 text-white"
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
      <div className="bg-primary px-5 py-5">
        {content.badgeIcon && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-foreground/90 bg-primary-foreground/15 px-2.5 py-1 rounded-full mb-3">
            {content.badgeIcon}
            {content.badge}
          </span>
        )}
        <h3 className="text-2xl font-bold text-primary-foreground leading-tight">
          {content.title}
          <span className="block text-primary-foreground/90">{content.subtitle}</span>
        </h3>
        <p className="text-sm text-primary-foreground/75 mt-2">
          {content.description}
        </p>
      </div>

      {/* Form */}
      <div className="p-5 bg-card">
        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-4">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="lead-name" className="text-sm font-semibold text-foreground">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="lead-name"
              placeholder="John Smith"
              {...register("name")}
              className={`h-12 text-base rounded-xl bg-background border-2 text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                errors.name ? "border-destructive focus:border-destructive" : "border-input"
              }`}
            />
            {errors.name && (
              <p className="text-xs text-destructive font-medium">{errors.name.message}</p>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="lead-email" className="text-sm font-semibold text-foreground">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="lead-email"
              type="email"
              placeholder="john@example.com"
              {...register("email")}
              className={`h-12 text-base rounded-xl bg-background border-2 text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                errors.email ? "border-destructive focus:border-destructive" : "border-input"
              }`}
            />
            {errors.email && (
              <p className="text-xs text-destructive font-medium">{errors.email.message}</p>
            )}
          </div>

          {/* Phone Field */}
          <div className="space-y-2">
            <Label htmlFor="lead-phone" className="text-sm font-semibold text-foreground">
              Phone <span className="text-destructive">*</span>
            </Label>
            <Input
              id="lead-phone"
              type="tel"
              inputMode="tel"
              placeholder="(604) 555-0123"
              {...register("phone")}
              className={`h-12 text-base rounded-xl bg-background border-2 text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                errors.phone ? "border-destructive focus:border-destructive" : "border-input"
              }`}
            />
            {errors.phone && (
              <p className="text-xs text-destructive font-medium">{errors.phone.message}</p>
            )}
          </div>

          {/* Is Realtor Question */}
          <div className="space-y-2.5 pt-1">
            <Label className="text-sm font-semibold text-foreground">Are you a realtor?</Label>
            <RadioGroup 
              value={isRealtor} 
              onValueChange={(value) => setValue("is_realtor", value as "yes" | "no")}
              className="flex gap-3"
            >
              <Label 
                htmlFor="is-realtor-no" 
                className={`flex-1 flex items-center justify-center h-12 rounded-xl border-2 cursor-pointer transition-all text-sm font-semibold ${
                  isRealtor === "no" 
                    ? "border-primary bg-primary text-primary-foreground shadow-md" 
                    : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-muted/50"
                }`}
              >
                <RadioGroupItem value="no" id="is-realtor-no" className="sr-only" />
                No
              </Label>
              <Label 
                htmlFor="is-realtor-yes" 
                className={`flex-1 flex items-center justify-center h-12 rounded-xl border-2 cursor-pointer transition-all text-sm font-semibold ${
                  isRealtor === "yes" 
                    ? "border-primary bg-primary text-primary-foreground shadow-md" 
                    : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-muted/50"
                }`}
              >
                <RadioGroupItem value="yes" id="is-realtor-yes" className="sr-only" />
                Yes
              </Label>
            </RadioGroup>
          </div>

          {/* Has Realtor Question - Only show if they're not a realtor */}
          {isRealtor === "no" && (
            <div className="space-y-2.5">
              <Label className="text-sm font-semibold text-foreground">Working with a realtor?</Label>
              <RadioGroup 
                value={hasRealtor} 
                onValueChange={(value) => setValue("has_realtor", value as "yes" | "no")}
                className="flex gap-3"
              >
                <Label 
                  htmlFor="realtor-no" 
                  className={`flex-1 flex items-center justify-center h-12 rounded-xl border-2 cursor-pointer transition-all text-sm font-semibold ${
                    hasRealtor === "no" 
                      ? "border-primary bg-primary text-primary-foreground shadow-md" 
                      : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <RadioGroupItem value="no" id="realtor-no" className="sr-only" />
                  No
                </Label>
                <Label 
                  htmlFor="realtor-yes" 
                  className={`flex-1 flex items-center justify-center h-12 rounded-xl border-2 cursor-pointer transition-all text-sm font-semibold ${
                    hasRealtor === "yes" 
                      ? "border-primary bg-primary text-primary-foreground shadow-md" 
                      : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <RadioGroupItem value="yes" id="realtor-yes" className="sr-only" />
                  Yes
                </Label>
              </RadioGroup>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-14 text-base font-bold rounded-xl gap-2 shadow-lg mt-2"
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
                {content.buttonText}
                {content.buttonIcon}
              </>
            )}
          </Button>

          {/* Trust indicators */}
          <div className="flex items-center justify-center gap-5 pt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-green-500" />
              <span className="font-medium">Secure</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="font-medium">Instant</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-purple-500" />
              <span className="font-medium">Free</span>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
