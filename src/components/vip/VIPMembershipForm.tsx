import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, ArrowRight, Loader2 } from "lucide-react";
import { getVisitorId, getSessionId } from "@/lib/tracking/identifiers";

const schema = z.object({
  buyerType: z.string().min(1, "Please select your situation"),
  timeline: z.string().min(1, "Please select your timeline"),
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(10, "Phone number is required"),
  budget: z.string().min(1, "Please select a budget range"),
});

type FormData = z.infer<typeof schema>;

export const VIPMembershipForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("project_leads").insert({
        name: data.name,
        email: data.email,
        phone: data.phone,
        lead_source: "VIP Membership",
        budget: data.budget,
        persona: data.buyerType,
        timeline: data.timeline,
        visitor_id: getVisitorId(),
        session_id: getSessionId(),
        message: `VIP Membership Application | Type: ${data.buyerType} | Timeline: ${data.timeline}`,
      });

      if (error) throw error;

      setIsSubmitted(true);
      toast.success("Welcome to VIP! We'll be in touch within 24 hours.");
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <section id="membership-form" className="py-16 md:py-24 px-4 bg-muted/30">
        <div className="max-w-[500px] mx-auto text-center">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Welcome to VIP</h2>
          <p className="text-muted-foreground mb-6">
            Thank you for joining. We'll review your profile and reach out within 24 hours 
            to discuss your goals and show you relevant opportunities.
          </p>
          <Button onClick={() => setIsSubmitted(false)} variant="outline">
            Submit Another Application
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section id="membership-form" className="py-16 md:py-24 px-4 bg-muted/30">
      <div className="max-w-[600px] mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Join VIP Membership
          </h2>
          <p className="text-muted-foreground">
            Tell us about your goals and we'll connect you with relevant opportunities
          </p>
        </div>

        <div className="bg-card border rounded-2xl p-6 md:p-8 shadow-card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Buyer Type */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">I'm looking to...</Label>
              <RadioGroup
                onValueChange={(value) => setValue("buyerType", value)}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                {[
                  { value: "first-home", label: "Buy my first home" },
                  { value: "upgrade", label: "Upgrade my home" },
                  { value: "invest", label: "Invest in real estate" },
                  { value: "portfolio", label: "Build a portfolio" },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:border-primary/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <RadioGroupItem value={option.value} />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </RadioGroup>
              {errors.buyerType && (
                <p className="text-sm text-destructive">{errors.buyerType.message}</p>
              )}
            </div>

            {/* Timeline */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Timeline</Label>
              <RadioGroup
                onValueChange={(value) => setValue("timeline", value)}
                className="grid grid-cols-3 gap-3"
              >
                {[
                  { value: "now", label: "Ready now" },
                  { value: "3-6", label: "3-6 months" },
                  { value: "6-12", label: "6-12 months" },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center justify-center p-3 border rounded-lg cursor-pointer hover:border-primary/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5 text-center"
                  >
                    <RadioGroupItem value={option.value} className="sr-only" />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </RadioGroup>
              {errors.timeline && (
                <p className="text-sm text-destructive">{errors.timeline.message}</p>
              )}
            </div>

            {/* Contact Fields */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" {...register("name")} placeholder="Your name" />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" {...register("phone")} placeholder="(604) 555-1234" />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone.message}</p>
                )}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register("email")} placeholder="you@example.com" />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget">Budget Range</Label>
                <Select onValueChange={(value) => setValue("budget", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under-500k">Under $500K</SelectItem>
                    <SelectItem value="500k-750k">$500K - $750K</SelectItem>
                    <SelectItem value="750k-1m">$750K - $1M</SelectItem>
                    <SelectItem value="1m-1.5m">$1M - $1.5M</SelectItem>
                    <SelectItem value="1.5m+">$1.5M+</SelectItem>
                  </SelectContent>
                </Select>
                {errors.budget && (
                  <p className="text-sm text-destructive">{errors.budget.message}</p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full bg-primary text-primary-foreground font-semibold"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Join VIP Membership
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              By joining, you'll receive exclusive inventory updates and market insights. 
              You can unsubscribe at any time.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
};
