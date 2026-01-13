import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Download, Shield, CheckCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { getVisitorId, getSessionId, trackFormStart, trackFormSubmit } from "@/lib/tracking";
import { MetaEvents } from "@/components/tracking/MetaPixel";

const schema = z.object({
  email: z.string().email("Please enter a valid email").max(255),
});

type FormData = z.infer<typeof schema>;

export function ExitIntentPopup() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  useEffect(() => {
    // Check if already shown in this session or if user has already converted via ANY form
    const hasShown = sessionStorage.getItem("exit_intent_shown");
    const hasConverted = localStorage.getItem("presale_lead_converted");
    const hasSubmittedAnyForm = localStorage.getItem("pp_form_submitted");
    const hasBooking = localStorage.getItem("pp_booking_submitted");
    
    // Don't show if user already engaged with any form
    if (hasShown || hasConverted || hasSubmittedAnyForm || hasBooking) return;

    // Don't show on calculator page - users are actively engaged
    if (window.location.pathname === '/calculator') return;

    let timeout: NodeJS.Timeout;
    
    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger when mouse leaves toward the top (closing tab/navigating away)
      if (e.clientY <= 5 && e.relatedTarget === null) {
        // Add a small delay to prevent false triggers
        timeout = setTimeout(() => {
          setOpen(true);
          sessionStorage.setItem("exit_intent_shown", "true");
          // Track popup shown
          MetaEvents.formStart({
            content_name: "Exit Intent Guide",
            content_category: "lead_magnet",
          });
          trackFormStart({
            form_name: "exit_intent_guide",
            form_location: "exit_popup",
          });
        }, 100);
      }
    };

    // Delay adding listener to avoid immediate triggers - increased to 15 seconds
    const addListener = setTimeout(() => {
      document.addEventListener("mouseleave", handleMouseLeave);
    }, 15000);

    return () => {
      clearTimeout(addListener);
      clearTimeout(timeout);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      const visitorId = getVisitorId();
      const sessionId = getSessionId();
      const utmSource = sessionStorage.getItem("utm_source") || null;
      const utmMedium = sessionStorage.getItem("utm_medium") || null;
      const utmCampaign = sessionStorage.getItem("utm_campaign") || null;
      const referrer = sessionStorage.getItem("referrer") || document.referrer || null;
      const landingPage = sessionStorage.getItem("landing_page") || window.location.href;

      // Insert into newsletter_subscribers for guide download
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({
          email: data.email,
          source: "exit_intent_guide",
          preferred_city: null,
          wants_projects: true,
          wants_assignments: false,
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
          referrer: referrer,
          landing_page: landingPage,
        });

      if (error && !error.message.includes("duplicate")) throw error;

      // Track form submission
      trackFormSubmit({
        form_name: "exit_intent_guide",
        form_location: "exit_popup",
        email: data.email,
      });

      // Track Meta Pixel Lead event
      MetaEvents.lead({
        content_name: "Exit Intent Guide",
        content_category: "lead_magnet",
      });

      // Send server-side event
      supabase.functions
        .invoke("meta-conversions-api", {
          body: {
            event_name: "Lead",
            email: data.email,
            event_source_url: window.location.href,
            content_name: "7 Red Flags Guide",
            content_category: "lead_magnet",
            client_user_agent: navigator.userAgent,
            fbc: document.cookie.match(/_fbc=([^;]+)/)?.[1],
            fbp: document.cookie.match(/_fbp=([^;]+)/)?.[1],
          },
        })
        .catch(console.error);

      localStorage.setItem("presale_lead_converted", "true");
      setIsSubmitted(true);
      
      toast({
        title: "Check your email!",
        description: "Your guide is on its way.",
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-background">
        <VisuallyHidden>
          <DialogTitle>Get Free Presale Guide</DialogTitle>
        </VisuallyHidden>

        {/* Close button */}
        <button
          onClick={() => setOpen(false)}
          className="absolute right-3 top-3 z-10 p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4 text-white" />
        </button>

        {!isSubmitted ? (
          <>
            {/* Header */}
            <div className="bg-gradient-to-br from-foreground via-foreground to-foreground/85 px-6 py-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-full mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-background mb-2">
                Wait! Before You Go...
              </h2>
              <p className="text-background/80 text-sm">
                Get our FREE guide to avoid costly presale mistakes
              </p>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Download className="h-4 w-4 text-primary" />
                  7 Red Flags to Avoid When Buying Presale
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    Hidden contract clauses that cost buyers $50K+
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    Developer reputation warning signs
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    What the salesperson won't tell you
                  </li>
                </ul>
              </div>

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  autoComplete="email"
                  {...form.register("email")}
                  className="h-12 text-base"
                />
                
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-semibold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending..." : "Download Free Guide"}
                </Button>
              </form>

              <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  No spam, unsubscribe anytime
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  12,847 investors trust us
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              Check Your Email!
            </h2>
            <p className="text-muted-foreground mb-6">
              Your guide is on its way. While you wait, explore our latest presale projects.
            </p>
            <Button onClick={() => setOpen(false)}>
              Continue Browsing
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
