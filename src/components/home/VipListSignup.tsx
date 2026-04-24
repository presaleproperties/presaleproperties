import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Bell, CheckCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { trackFormSubmit } from "@/lib/tracking";

const schema = z.object({
  email: z.string().email("Please enter a valid email").max(255),
});

type FormData = z.infer<typeof schema>;

export function VipListSignup() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const utmSource = sessionStorage.getItem("utm_source") || null;
      const utmMedium = sessionStorage.getItem("utm_medium") || null;
      const utmCampaign = sessionStorage.getItem("utm_campaign") || null;

      const { error } = await supabase.from("newsletter_subscribers").insert({
        email: data.email.trim(),
        source: "vip_list_homepage",
        wants_projects: true,
        wants_assignments: false,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        landing_page: window.location.href,
      });

      if (error && !error.message.includes("duplicate")) throw error;

      trackFormSubmit({ form_name: "vip_list", form_location: "homepage", email: data.email });
      setIsSubmitted(true);
    } catch (error: any) {
      console.error(error);
      toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-12 md:py-16">
      <div className="container px-4">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 p-8 md:p-12">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-primary/15 border border-primary/30 rounded-full px-3 py-1 mb-4">
                <Bell className="h-3 w-3 text-primary" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">VIP Launch List</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-foreground leading-tight mb-3">
                Get new presale launches <span className="text-primary">before they go public</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Join 2,400+ Metro Vancouver buyers getting early access to floor plans, VIP pricing, and incentives — direct from developers, before public release.
              </p>
            </div>

            <div>
              {!isSubmitted ? (
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      autoComplete="email"
                      {...form.register("email")}
                      className="h-12 pl-10 text-base bg-background"
                    />
                  </div>
                  {form.formState.errors.email && (
                    <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                  )}
                  <Button type="submit" size="lg" className="w-full h-12 font-bold" disabled={isSubmitting}>
                    {isSubmitting ? "Joining…" : "Join the VIP List — Free"}
                  </Button>
                  <p className="text-[11px] text-center text-muted-foreground">
                    Unsubscribe anytime. We never share your email.
                  </p>
                </form>
              ) : (
                <div className="flex items-start gap-3 p-5 rounded-xl bg-background border border-primary/30">
                  <CheckCircle className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-foreground mb-1">You're on the list! 🎉</p>
                    <p className="text-sm text-muted-foreground">
                      You'll get an email the moment a new project opens VIP registration.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
