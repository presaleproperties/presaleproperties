import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send, CheckCircle, Bell, Sparkles, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const leadSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Please enter a valid email").max(255, "Email must be less than 255 characters"),
  phone: z.string().trim().max(20, "Phone must be less than 20 characters").optional().or(z.literal("")),
  has_realtor: z.enum(["yes", "no", "open"]),
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
  const { toast } = useToast();

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
      has_realtor: "no",
    },
  });

  const hasRealtor = watch("has_realtor");

  const onSubmit = async (data: LeadFormData) => {
    setIsSubmitting(true);

    try {
      // Include realtor status in message field for now
      const realtorNote = data.has_realtor === "yes" 
        ? "Already working with a realtor." 
        : data.has_realtor === "open" 
          ? "Open to working with a realtor." 
          : "Does not have a realtor.";

      const { error } = await supabase.from("project_leads").insert({
        project_id: projectId,
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        message: realtorNote,
      });

      if (error) throw error;

      setIsSubmitted(true);
      reset();
      toast({
        title: status === "coming_soon" ? "You're on the list!" : "Plans sent!",
        description: status === "coming_soon" 
          ? "We'll send you exclusive updates and early access."
          : "Check your email for floor plans and pricing.",
      });
    } catch (error) {
      console.error("Error submitting lead:", error);
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 rounded-xl p-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
          <CheckCircle className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          {status === "coming_soon" ? "You're on the VIP List!" : "Plans Sent!"}
        </h3>
        <p className="text-muted-foreground mb-4">
          {status === "coming_soon" 
            ? "We'll notify you with exclusive early access, pricing, and floor plans."
            : "Check your email for floor plans, pricing, and project details."
          }
        </p>
        <Button
          variant="outline"
          onClick={() => setIsSubmitted(false)}
          className="w-full"
        >
          Submit Another Request
        </Button>
      </div>
    );
  }

  const getFormContent = () => {
    switch (status) {
      case "coming_soon":
        return {
          badge: "Early Access",
          badgeIcon: <Sparkles className="h-3 w-3" />,
          title: "Be the first to know.",
          description: "Get on the waitlist to be the first to hear when this project is ready to start selling.",
          buttonText: "Register Now",
          buttonIcon: <Send className="h-4 w-4 mr-2" />,
        };
      case "active":
        return {
          badge: "Now Selling",
          badgeIcon: <Bell className="h-3 w-3" />,
          title: "Download Floor Plans & Pricing",
          description: "Get instant access to floor plans, pricing sheets, and exclusive incentives.",
          buttonText: "Download Plans",
          buttonIcon: <Download className="h-4 w-4 mr-2" />,
        };
      default:
        return {
          badge: "Sold Out",
          badgeIcon: null,
          title: "Join the Waitlist",
          description: "Get notified if any units become available or for similar upcoming projects.",
          buttonText: "Join Waitlist",
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            <Label htmlFor="lead-phone" className="text-sm font-medium">Phone (optional)</Label>
            <Input
              id="lead-phone"
              type="tel"
              placeholder="(604) 555-0123"
              {...register("phone")}
              className={`h-11 ${errors.phone ? "border-destructive" : ""}`}
            />
          </div>

          {/* Realtor Question */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Are you working with a realtor?</Label>
            <RadioGroup 
              value={hasRealtor} 
              onValueChange={(value) => setValue("has_realtor", value as "yes" | "no" | "open")}
              className="flex flex-col gap-2"
            >
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="no" id="realtor-no" />
                <Label htmlFor="realtor-no" className="text-sm font-normal cursor-pointer">No, I don't have a realtor</Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="yes" id="realtor-yes" />
                <Label htmlFor="realtor-yes" className="text-sm font-normal cursor-pointer">Yes, I already have a realtor</Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="open" id="realtor-open" />
                <Label htmlFor="realtor-open" className="text-sm font-normal cursor-pointer">Open to working with one</Label>
              </div>
            </RadioGroup>
          </div>

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
