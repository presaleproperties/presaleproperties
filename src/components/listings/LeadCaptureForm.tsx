import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const leadSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Please enter a valid email").max(255, "Email must be less than 255 characters"),
  phone: z.string().trim().max(20, "Phone must be less than 20 characters").optional().or(z.literal("")),
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

  const onSubmit = async (data: LeadFormData) => {
    setIsSubmitting(true);

    try {
      const { data: leadData, error } = await supabase.from("leads").insert({
        listing_id: listingId,
        agent_id: agentId,
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        message: data.message || null,
      }).select("id").single();

      if (error) throw error;

      // Try to send email notification (non-blocking)
      if (leadData?.id) {
        supabase.functions.invoke("send-lead-notification", {
          body: { leadId: leadData.id }
        }).catch(err => console.log("Email notification skipped:", err));
      }

      setIsSubmitted(true);
      reset();
      toast({
        title: "Request Sent!",
        description: "The agent will be in touch with you shortly.",
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
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Request Sent!
          </h3>
          <p className="text-muted-foreground mb-4">
            Thank you for your interest. The listing agent will contact you shortly.
          </p>
          <Button
            variant="outline"
            onClick={() => setIsSubmitted(false)}
            className="w-full"
          >
            Send Another Request
          </Button>
        </CardContent>
      </Card>
    );
  }

  const formTitle = isRestricted ? "Request Full Assignment Details" : "Request More Info";
  const formDescription = isRestricted 
    ? "Some details are restricted due to developer marketing rules and will be shared by the agent after inquiry."
    : "Interested in this assignment? Fill out the form and the agent will get back to you.";

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-lg">{formTitle}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {formDescription}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="Your full name"
              {...register("name")}
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              {...register("email")}
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="(604) 555-0123"
              {...register("phone")}
              className={errors.phone ? "border-destructive" : ""}
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message (optional)</Label>
            <Textarea
              id="message"
              placeholder={isRestricted 
                ? "I'm interested in learning more about this restricted assignment..."
                : "I'm interested in learning more about this assignment..."
              }
              rows={4}
              {...register("message")}
              className={errors.message ? "border-destructive" : ""}
            />
            {errors.message && (
              <p className="text-sm text-destructive">{errors.message.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
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

          <p className="text-xs text-muted-foreground text-center">
            By submitting, you agree to be contacted about this listing.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
