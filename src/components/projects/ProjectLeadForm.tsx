import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send, CheckCircle, Bell, Sparkles, Download, MessageCircle } from "lucide-react";
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

  const defaultWhatsappNumber = "16045551234"; // Fallback number
  const whatsappMessage = encodeURIComponent(`Hi! I just submitted my info for ${projectName} and would love to learn more.`);
  const whatsappLink = `https://wa.me/${whatsappNumber || defaultWhatsappNumber}?text=${whatsappMessage}`;

  if (isSubmitted) {
    return (
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 rounded-xl p-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
          <CheckCircle className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          All Set!
        </h3>
        <p className="text-muted-foreground mb-4">
          Check your email for floor plans, pricing, and project details.
        </p>
        <Button
          asChild
          className="w-full"
        >
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4 mr-2" />
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
          title: "Get Early Access to Plans & Pricing",
          description: "Register now to receive floor plans and pricing as soon as they're released.",
          buttonText: "Get Early Access",
          buttonIcon: <Download className="h-4 w-4 mr-2" />,
        };
      case "active":
        return {
          badge: "Instant Access",
          badgeIcon: <Download className="h-3 w-3" />,
          title: "Download Floor Plans & Pricing",
          description: "Get instant access to all available floor plans, pricing sheets, and current incentives.",
          buttonText: "Get Instant Access",
          buttonIcon: <Download className="h-4 w-4 mr-2" />,
        };
      default:
        return {
          badge: "Sold Out",
          badgeIcon: null,
          title: "Get Notified of Similar Projects",
          description: "Be the first to know about similar upcoming projects in this area.",
          buttonText: "Notify Me",
          buttonIcon: <Send className="h-4 w-4 mr-2" />,
        };
    }
  };

  const content = getFormContent();

  return (
    <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 rounded-xl overflow-hidden">
      {/* Header with urgency messaging */}
      <div className="bg-primary/10 px-5 py-4 border-b border-primary/10">
        <div className="flex items-center gap-2 mb-2">
          {content.badgeIcon && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {content.badgeIcon}
              {content.badge}
            </span>
          )}
        </div>
        <h3 className="text-xl font-bold text-foreground">
          {content.title}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {content.description}
        </p>
      </div>

      {/* Form */}
      <div className="p-5">
        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lead-name" className="text-sm font-medium">Full Name *</Label>
            <Input
              id="lead-name"
              placeholder="Your full name"
              {...register("name")}
              className={`h-11 ${errors.name ? "border-destructive" : ""}`}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead-email" className="text-sm font-medium">Email *</Label>
            <Input
              id="lead-email"
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
            <Label htmlFor="lead-phone" className="text-sm font-medium">Phone *</Label>
            <Input
              id="lead-phone"
              type="tel"
              placeholder="(604) 555-0123"
              {...register("phone")}
              className={`h-11 ${errors.phone ? "border-destructive" : ""}`}
            />
            {errors.phone && (
              <p className="text-xs text-destructive">{errors.phone.message}</p>
            )}
          </div>

          {/* Is Realtor Question */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Are you a realtor?</Label>
            <RadioGroup 
              value={isRealtor} 
              onValueChange={(value) => setValue("is_realtor", value as "yes" | "no")}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="is-realtor-no" />
                <Label htmlFor="is-realtor-no" className="text-sm font-normal cursor-pointer">No</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="is-realtor-yes" />
                <Label htmlFor="is-realtor-yes" className="text-sm font-normal cursor-pointer">Yes</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Has Realtor Question - Only show if they're not a realtor */}
          {isRealtor === "no" && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Are you working with a realtor?</Label>
              <RadioGroup 
                value={hasRealtor} 
                onValueChange={(value) => setValue("has_realtor", value as "yes" | "no")}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="realtor-no" />
                  <Label htmlFor="realtor-no" className="text-sm font-normal cursor-pointer">No</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="realtor-yes" />
                  <Label htmlFor="realtor-yes" className="text-sm font-normal cursor-pointer">Yes</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              "Submitting..."
            ) : (
              <>
                {content.buttonIcon}
                {content.buttonText}
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            By submitting, you agree to receive updates about this project.
          </p>
        </form>
      </div>
    </div>
  );
}
