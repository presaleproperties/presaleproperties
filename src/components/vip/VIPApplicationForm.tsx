import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, ArrowRight, Loader2 } from "lucide-react";
import { getVisitorId, getSessionId } from "@/lib/tracking/identifiers";

const eliteSchema = z.object({
  goals: z.string().min(1, "Please select your goals"),
  timeline: z.string().min(1, "Please select your timeline"),
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(10, "Phone is required"),
  budget: z.string().min(1, "Please select a budget"),
  notifyInventory: z.boolean().optional(),
  notifyIntel: z.boolean().optional(),
});

const accessSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
});

type EliteFormData = z.infer<typeof eliteSchema>;
type AccessFormData = z.infer<typeof accessSchema>;

export const VIPApplicationForm = () => {
  const [activeTab, setActiveTab] = useState<"elite" | "access">("elite");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const eliteForm = useForm<EliteFormData>({
    resolver: zodResolver(eliteSchema),
    defaultValues: {
      notifyInventory: true,
      notifyIntel: true,
    },
  });

  const accessForm = useForm<AccessFormData>({
    resolver: zodResolver(accessSchema),
  });

  const onEliteSubmit = async (data: EliteFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("project_leads").insert({
        name: data.name,
        email: data.email,
        phone: data.phone,
        lead_source: "VIP Elite Application",
        budget: data.budget,
        persona: data.goals,
        timeline: data.timeline,
        visitor_id: getVisitorId(),
        session_id: getSessionId(),
        message: `Goals: ${data.goals} | Notify Inventory: ${data.notifyInventory} | Notify Intel: ${data.notifyIntel}`,
      });

      if (error) throw error;

      setIsSubmitted(true);
      toast.success("Application submitted! We'll be in touch within 24 hours.");
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onAccessSubmit = async (data: AccessFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("newsletter_subscribers").insert({
        email: data.email,
        source: "VIP Access Signup",
        preferred_city: data.name, // Store name temporarily in this field
      });

      if (error && !error.message.includes("duplicate")) throw error;

      setIsSubmitted(true);
      toast.success("Welcome to VIP Access! Check your inbox for exclusive updates.");
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <section id="application-form" className="py-20 md:py-28 px-4 bg-muted/30">
        <div className="max-w-[600px] mx-auto text-center">
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-success" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-4">You're In!</h2>
          <p className="text-muted-foreground text-lg mb-8">
            {activeTab === "elite"
              ? "We'll review your application and reach out within 24 hours to schedule your strategy call."
              : "You're now on our VIP Access list. Watch your inbox for exclusive presale opportunities!"}
          </p>
          <Button onClick={() => setIsSubmitted(false)} variant="outline">
            Submit Another Application
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section id="application-form" className="py-20 md:py-28 px-4 bg-muted/30">
      <div className="max-w-[1000px] mx-auto">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground text-center mb-4">
          Claim Your $1,500 Credit + VIP Elite Access
        </h2>
        <p className="text-lg text-muted-foreground text-center mb-12">Two ways to get started</p>

        {/* Tabs */}
        <div className="flex justify-center gap-4 mb-12">
          <button
            onClick={() => setActiveTab("elite")}
            className={`px-6 py-3 rounded-full font-semibold transition-all ${
              activeTab === "elite"
                ? "bg-primary text-primary-foreground shadow-gold"
                : "bg-card border text-foreground hover:bg-muted"
            }`}
          >
            Ready to Buy Now?
          </button>
          <button
            onClick={() => setActiveTab("access")}
            className={`px-6 py-3 rounded-full font-semibold transition-all ${
              activeTab === "access"
                ? "bg-primary text-primary-foreground shadow-gold"
                : "bg-card border text-foreground hover:bg-muted"
            }`}
          >
            Not Ready Yet?
          </button>
        </div>

        {activeTab === "elite" ? (
          <div className="bg-card rounded-2xl p-6 md:p-10 border shadow-card">
            <h3 className="text-2xl font-bold text-foreground mb-2">Apply for VIP Elite Membership</h3>
            <p className="text-muted-foreground mb-8">
              Fill out the form below and we'll review your goals, schedule a strategy call, and show you exclusive inventory opportunities.
            </p>

            <form onSubmit={eliteForm.handleSubmit(onEliteSubmit)} className="space-y-6">
              {/* Goals */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Your Goals</Label>
                <RadioGroup
                  onValueChange={(value) => eliteForm.setValue("goals", value)}
                  className="grid grid-cols-1 md:grid-cols-3 gap-3"
                >
                  {[
                    { value: "first-time", label: "First-time home buyer" },
                    { value: "investor-1-2", label: "Investor (1-2 units)" },
                    { value: "portfolio", label: "Portfolio builder (3-5+ units)" },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:border-primary/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                    >
                      <RadioGroupItem value={option.value} />
                      <span className="text-sm font-medium">{option.label}</span>
                    </label>
                  ))}
                </RadioGroup>
                {eliteForm.formState.errors.goals && (
                  <p className="text-sm text-destructive">{eliteForm.formState.errors.goals.message}</p>
                )}
              </div>

              {/* Timeline */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Timeline</Label>
                <RadioGroup
                  onValueChange={(value) => eliteForm.setValue("timeline", value)}
                  className="grid grid-cols-1 md:grid-cols-3 gap-3"
                >
                  {[
                    { value: "now", label: "Ready now (next 30 days)" },
                    { value: "3-6", label: "Next 3-6 months" },
                    { value: "6-12", label: "Next 6-12 months" },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:border-primary/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                    >
                      <RadioGroupItem value={option.value} />
                      <span className="text-sm font-medium">{option.label}</span>
                    </label>
                  ))}
                </RadioGroup>
                {eliteForm.formState.errors.timeline && (
                  <p className="text-sm text-destructive">{eliteForm.formState.errors.timeline.message}</p>
                )}
              </div>

              {/* Contact Fields */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" {...eliteForm.register("name")} placeholder="Your full name" />
                  {eliteForm.formState.errors.name && (
                    <p className="text-sm text-destructive">{eliteForm.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...eliteForm.register("email")} placeholder="you@example.com" />
                  {eliteForm.formState.errors.email && (
                    <p className="text-sm text-destructive">{eliteForm.formState.errors.email.message}</p>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" type="tel" {...eliteForm.register("phone")} placeholder="(604) 555-1234" />
                  {eliteForm.formState.errors.phone && (
                    <p className="text-sm text-destructive">{eliteForm.formState.errors.phone.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget Range</Label>
                  <Select onValueChange={(value) => eliteForm.setValue("budget", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select budget range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="under-400k">Under $400K</SelectItem>
                      <SelectItem value="400k-600k">$400K-$600K</SelectItem>
                      <SelectItem value="600k-800k">$600K-$800K</SelectItem>
                      <SelectItem value="800k-1m">$800K-$1M</SelectItem>
                      <SelectItem value="1m+">$1M+</SelectItem>
                    </SelectContent>
                  </Select>
                  {eliteForm.formState.errors.budget && (
                    <p className="text-sm text-destructive">{eliteForm.formState.errors.budget.message}</p>
                  )}
                </div>
              </div>

              {/* Checkboxes */}
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={eliteForm.watch("notifyInventory")}
                    onCheckedChange={(checked) => eliteForm.setValue("notifyInventory", !!checked)}
                  />
                  <span className="text-sm">Notify me about exclusive inventory opportunities</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={eliteForm.watch("notifyIntel")}
                    onCheckedChange={(checked) => eliteForm.setValue("notifyIntel", !!checked)}
                  />
                  <span className="text-sm">Send me monthly presale market intelligence</span>
                </label>
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
                    Apply for VIP Elite + Claim $1,500 Credit
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>
            </form>
          </div>
        ) : (
          <div className="bg-card rounded-2xl p-6 md:p-10 border shadow-card max-w-[600px] mx-auto">
            <h3 className="text-2xl font-bold text-foreground mb-2">Join VIP Access (Free)</h3>
            <p className="text-muted-foreground mb-6">
              Get early access and market intelligence while you plan:
            </p>
            <ul className="space-y-2 mb-8">
              {[
                "See new projects 7-14 days before public",
                "Monthly presale market reports",
                "Developer track records",
                "Early access alerts",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-foreground">
                  <Check className="w-4 h-4 text-success" />
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted-foreground mb-6">
              No purchase required. No commitment. Free.<br />
              When you're ready to buy, upgrade to VIP Elite and claim your $1,500 credit.
            </p>

            <form onSubmit={accessForm.handleSubmit(onAccessSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="access-name">Name</Label>
                <Input id="access-name" {...accessForm.register("name")} placeholder="Your name" />
                {accessForm.formState.errors.name && (
                  <p className="text-sm text-destructive">{accessForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="access-email">Email</Label>
                <Input id="access-email" type="email" {...accessForm.register("email")} placeholder="you@example.com" />
                {accessForm.formState.errors.email && (
                  <p className="text-sm text-destructive">{accessForm.formState.errors.email.message}</p>
                )}
              </div>
              <Button
                type="submit"
                variant="outline"
                size="lg"
                className="w-full font-semibold"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Join Free VIP Access →"}
              </Button>
            </form>
          </div>
        )}
      </div>
    </section>
  );
};
