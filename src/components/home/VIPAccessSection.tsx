import { useState } from "react";
import { Sparkles, Check, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const BENEFITS = [
  "VIP deposit structures",
  "Exclusive pricing",
  "Private events",
];

export function VIPAccessSection() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({
          id: crypto.randomUUID(),
          email: email.trim().toLowerCase(),
          source: "vip_access_homepage",
          wants_projects: true,
          landing_page: window.location.pathname,
          referrer: document.referrer || null,
          utm_source: sessionStorage.getItem("utm_source") || null,
          utm_medium: sessionStorage.getItem("utm_medium") || null,
          utm_campaign: sessionStorage.getItem("utm_campaign") || null,
        });

      if (error) {
        if (error.code === "23505") {
          toast.success("You're already on our VIP list!");
        } else {
          throw error;
        }
      } else {
        toast.success("Welcome to the VIP list!");
      }
      setEmail("");
    } catch (error) {
      console.error("Subscription error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-20 bg-[#0a0a0a]">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center">
          {/* VIP Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            Exclusive Access
          </div>

          {/* Headline */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Get VIP Access to Exclusive Offers
          </h2>

          {/* Subheadline */}
          <p className="text-lg text-gray-400 mb-8 max-w-xl mx-auto">
            Be the first to know about VIP deposit structures, exclusive pricing, 
            and private sales events before the public.
          </p>

          {/* Benefits */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 mb-10">
            {BENEFITS.map((benefit) => (
              <div key={benefit} className="flex items-center gap-2 text-gray-300">
                <Check className="h-4 w-4 text-primary" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-4">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-14 text-base bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-primary focus:bg-white/15"
              disabled={isSubmitting}
            />
            <Button 
              type="submit" 
              size="lg"
              className="h-14 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Get VIP Access
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Disclaimer */}
          <p className="text-sm text-gray-500">
            Free forever. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </section>
  );
}
